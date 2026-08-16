import { afterEach, describe, expect, it, vi } from "vitest";

import type { PeakEffectRecipe } from "@/lib/effects/peakEffects";
import { createVhsSignalRenderer } from "./vhsSignalRenderer";

function webGlContext() {
  const gl = {
    ARRAY_BUFFER: 0x8892,
    BLEND: 0x0be2,
    COLOR_BUFFER_BIT: 0x4000,
    COMPILE_STATUS: 0x8b81,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: 0x8b82,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    SRC_ALPHA: 0x0302,
    STATIC_DRAW: 0x88e4,
    TRIANGLES: 0x0004,
    VERTEX_SHADER: 0x8b31,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    blendFunc: vi.fn(),
    bufferData: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: vi.fn(() => ({ kind: "buffer" })),
    createProgram: vi.fn(() => ({ kind: "program" })),
    createShader: vi.fn((kind: number) => ({ kind })),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    drawArrays: vi.fn(),
    enable: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getProgramParameter: vi.fn(() => true),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_program: unknown, name: string) => ({ name })),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  };
  return gl;
}

const recipe: PeakEffectRecipe = {
  seed: 91,
  strength: 0.94,
  durationMs: 120,
  shakeDurationMs: 90,
  shakeX: 4,
  shakeY: -2,
  sliceOffset: 5,
  rgbOffset: 3,
  noiseOpacity: 0.12,
  flash: 0.16,
  crackleDensity: 0.7,
  burstCount: 36,
  variant: "combined",
};

describe("createVhsSignalRenderer", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the required transparent, non-antialiased WebGL context", () => {
    const gl = webGlContext();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(gl as unknown as WebGLRenderingContext);

    const renderer = createVhsSignalRenderer(document.createElement("canvas"));

    expect(renderer).not.toBeNull();
    expect(getContext).toHaveBeenCalledWith("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    expect(gl.enable).toHaveBeenCalledWith(gl.BLEND);
    expect(gl.blendFunc).toHaveBeenCalledWith(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  });

  it("returns null without throwing when WebGL is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(createVhsSignalRenderer(document.createElement("canvas"))).toBeNull();
  });

  it("deletes partially allocated resources when shader linking fails", () => {
    const gl = webGlContext();
    gl.getProgramParameter.mockReturnValue(false);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(gl as unknown as WebGLRenderingContext);

    expect(createVhsSignalRenderer(document.createElement("canvas"))).toBeNull();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteBuffer).not.toHaveBeenCalled();
  });

  it("bounds resolution, renders the recipe uniforms, and draws one triangle", () => {
    const gl = webGlContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(gl as unknown as WebGLRenderingContext);
    const canvas = document.createElement("canvas");
    const renderer = createVhsSignalRenderer(canvas)!;

    renderer.resize(320, 180, 3);
    renderer.render(1_250, recipe, 0.25);

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(360);
    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 640, 360);
    expect(gl.uniform2f).toHaveBeenCalledWith({ name: "u_resolution" }, 640, 360);
    expect(gl.uniform1f).toHaveBeenCalledWith({ name: "u_seed" }, 91);
    expect(gl.uniform1f).toHaveBeenCalledWith({ name: "u_strength" }, 0.705);
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 3);
  });

  it("clears with neutral uniforms when there is no active recipe", () => {
    const gl = webGlContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(gl as unknown as WebGLRenderingContext);
    const renderer = createVhsSignalRenderer(document.createElement("canvas"))!;

    renderer.render(32, null, 1);

    expect(gl.uniform1f).toHaveBeenCalledWith({ name: "u_strength" }, 0);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it("disposes owned GPU resources exactly once", () => {
    const gl = webGlContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(gl as unknown as WebGLRenderingContext);
    const renderer = createVhsSignalRenderer(document.createElement("canvas"))!;

    renderer.dispose();
    renderer.dispose();

    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  });
});
