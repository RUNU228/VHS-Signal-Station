import type { PeakEffectRecipe } from "@/lib/effects/peakEffects";

export type VhsSignalRenderer = {
  resize: (width: number, height: number, devicePixelRatio: number) => void;
  render: (
    timeMs: number,
    recipe: PeakEffectRecipe | null,
    progress: number,
  ) => void;
  dispose: () => void;
};

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_strength;
uniform float u_rgbOffset;
uniform float u_sliceOffset;
uniform float u_noise;
uniform float u_flash;
uniform float u_crackle;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7)) + u_seed) * 43758.5453);
}

void main() {
  vec2 pixel = max(u_resolution, vec2(1.0));
  float band = step(0.77, hash(vec2(floor(v_uv.y * 31.0), floor(u_time * 30.0))));
  float slice = (u_sliceOffset / pixel.x) * band * sin(v_uv.y * 173.0 + u_seed);
  float rgb = u_rgbOffset / pixel.x;
  float redBand = smoothstep(0.18, 0.82, fract((v_uv.x + slice + rgb) * 3.0));
  float blueBand = smoothstep(0.18, 0.82, fract((v_uv.x + slice - rgb) * 3.0));
  float grain = hash(floor(v_uv * pixel * 0.45) + floor(u_time * 45.0));
  float crackle = step(1.0 - u_crackle * 0.035, grain);
  float scanline = 0.5 + 0.5 * sin(v_uv.y * pixel.y * 1.7);
  vec3 splitColor = vec3(redBand, (redBand + blueBand) * 0.28, blueBand);
  vec3 color = splitColor * (0.16 * u_strength + u_flash);
  color += vec3(grain * u_noise * 0.38 + crackle * u_strength * 0.3);
  color *= 0.82 + scanline * 0.18;
  float alpha = clamp(u_flash + u_noise * grain + crackle * 0.34 + band * u_strength * 0.06, 0.0, 0.42);
  gl_FragColor = vec4(color, alpha);
}
`;

type Uniforms = {
  resolution: WebGLUniformLocation;
  time: WebGLUniformLocation;
  seed: WebGLUniformLocation;
  strength: WebGLUniformLocation;
  rgbOffset: WebGLUniformLocation;
  sliceOffset: WebGLUniformLocation;
  noise: WebGLUniformLocation;
  flash: WebGLUniformLocation;
  crackle: WebGLUniformLocation;
};

function compileShader(
  gl: WebGLRenderingContext,
  kind: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function uniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation | null {
  return gl.getUniformLocation(program, name);
}

export function createVhsSignalRenderer(
  canvas: HTMLCanvasElement,
): VhsSignalRenderer | null {
  let gl: WebGLRenderingContext | null = null;
  let vertexShader: WebGLShader | null = null;
  let fragmentShader: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;

  const releaseAllocated = () => {
    if (!gl) return;
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    buffer = null;
    program = null;
    vertexShader = null;
    fragmentShader = null;
  };

  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) return null;

    vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    if (!vertexShader) return null;
    fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!fragmentShader) {
      releaseAllocated();
      return null;
    }

    program = gl.createProgram();
    if (!program) {
      releaseAllocated();
      return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      releaseAllocated();
      return null;
    }

    buffer = gl.createBuffer();
    const position = gl.getAttribLocation(program, "a_position");
    const resolution = uniform(gl, program, "u_resolution");
    const time = uniform(gl, program, "u_time");
    const seed = uniform(gl, program, "u_seed");
    const strength = uniform(gl, program, "u_strength");
    const rgbOffset = uniform(gl, program, "u_rgbOffset");
    const sliceOffset = uniform(gl, program, "u_sliceOffset");
    const noise = uniform(gl, program, "u_noise");
    const flash = uniform(gl, program, "u_flash");
    const crackle = uniform(gl, program, "u_crackle");
    const uniformValues = [resolution, time, seed, strength, rgbOffset, sliceOffset, noise, flash, crackle];
    if (!buffer || position < 0 || uniformValues.some((value) => value === null)) {
      releaseAllocated();
      return null;
    }

    const uniforms: Uniforms = {
      resolution: resolution!,
      time: time!,
      seed: seed!,
      strength: strength!,
      rgbOffset: rgbOffset!,
      sliceOffset: sliceOffset!,
      noise: noise!,
      flash: flash!,
      crackle: crackle!,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    vertexShader = null;
    fragmentShader = null;

    let disposed = false;
    const rendererProgram = program;
    const rendererBuffer = buffer;

    return {
      resize(width, height, devicePixelRatio) {
        if (disposed) return;
        const dpr = Math.min(2, Math.max(0.5, devicePixelRatio || 1));
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        gl!.viewport(0, 0, canvas.width, canvas.height);
      },
      render(timeMs, recipe, progress) {
        if (disposed) return;
        const envelope = recipe ? Math.max(0, 1 - Math.min(1, Math.max(0, progress))) : 0;
        gl!.useProgram(rendererProgram);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl!.uniform1f(uniforms.time, timeMs / 1_000);
        gl!.uniform1f(uniforms.seed, recipe?.seed ?? 0);
        gl!.uniform1f(uniforms.strength, (recipe?.strength ?? 0) * envelope);
        gl!.uniform1f(uniforms.rgbOffset, (recipe?.rgbOffset ?? 0) * envelope);
        gl!.uniform1f(uniforms.sliceOffset, (recipe?.sliceOffset ?? 0) * envelope);
        gl!.uniform1f(uniforms.noise, (recipe?.noiseOpacity ?? 0) * envelope);
        gl!.uniform1f(uniforms.flash, (recipe?.flash ?? 0) * envelope);
        gl!.uniform1f(uniforms.crackle, (recipe?.crackleDensity ?? 0) * envelope);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        gl!.deleteBuffer(rendererBuffer);
        gl!.deleteProgram(rendererProgram);
      },
    };
  } catch {
    releaseAllocated();
    return null;
  }
}
