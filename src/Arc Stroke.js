// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_mvmatrix;
  uniform mat4 u_pmatrix;
  uniform mediump vec2 u_center;
  void main() {
    vec4 pos = u_pmatrix * u_mvmatrix * vec4(a_Position.xy / 1.0, 0, 1);
    gl_Position = pos;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  #define feather 0.5
  precision mediump float;
  uniform mediump vec2 u_center;
  uniform mediump float u_radius;
  uniform mediump float u_lineWidth;
  void main() {
    vec2 p = vec2(gl_FragCoord.x, gl_FragCoord.y);
    float dist = distance(p, u_center);

    float halfLineWidth = u_lineWidth / 2.0 + 0.5;
    float d = abs(dist - u_radius);
    float alpha = 0.0;
    if (d < halfLineWidth){
      alpha = clamp(abs(d - halfLineWidth) / 1.0, 0.0, 1.0);
    } else {
      alpha = 0.0;
    }

    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }`;

var radius = 50.0;
var lineWidth = 20.0;
var center = new Point(100.0, 75.0);

function main() {
  // Draw 2d canvas with testing
  var _2dCanvas = document.getElementById("2d");

  var ctx = _2dCanvas.getContext("2d");
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.arc(100, 75, 50, 0, 1.5 * Math.PI, true);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.arc(100, 200, 50, 0, 1.5 * Math.PI, true);
  ctx.fill();

  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = canvas.getContext("experimental-webgl", {
    antialias: false
  });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.BLEND);
  gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

  gl.blendFuncSeparate(
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA
  );

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Initialize matrices
  var mvMatrix = mat4.create();
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [0, 0, -1]);

  var pMatrix = mat4.create();
  mat4.ortho(0, gl.canvas.offsetWidth, gl.canvas.offsetHeight, 0, 1, 50, pMatrix);

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  var u_pmatrix = gl.getUniformLocation(gl.program, "u_pmatrix");
  var u_mvmatrix = gl.getUniformLocation(gl.program, "u_mvmatrix");
  var u_center = gl.getUniformLocation(gl.program, "u_center");
  var u_radius = gl.getUniformLocation(gl.program, "u_radius");
  var u_lineWidth = gl.getUniformLocation(gl.program, "u_lineWidth");
  gl.uniformMatrix4fv(u_pmatrix, false, pMatrix);
  gl.uniformMatrix4fv(u_mvmatrix, false, mvMatrix);

  // 400 = canvas height, need to translate origin to lower left
  // because gl_FragCoord is base on lower left origin
  gl.uniform2f(u_center, center.x, gl.canvas.height - center.y);

  gl.uniform1f(u_radius, radius);

  gl.uniform1f(u_lineWidth, lineWidth);

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.9, 0.9, 0.9, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
  var p1 = center;

  var vP1P2 = new Point(radius + lineWidth, 0);
  var vP1P3 = new Point(0, -1 * (radius + lineWidth));

  var p2 = p1.add(vP1P2);
  var p3 = p1.add(vP1P3);
  var p4 = p2.add(vP1P3);

  var vertices = new Float32Array([
    // triangle 1
    p1.x, p1.y,
    p2.x, p2.y,
    p4.x, p4.y,

    // triangle 2
    p1.x, p1.y,
    p3.x, p3.y,
    p4.x, p4.y,
  ]);

  var n = 6; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  var FSIZE = vertices.BYTES_PER_ELEMENT;
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 2, 0);
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
  return n;
}
