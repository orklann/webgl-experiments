// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_mvmatrix;
  uniform mat4 u_pmatrix;
  void main() {
    vec4 pos = u_pmatrix * u_mvmatrix * vec4(a_Position.xy / 1.0, 0, 1);
    gl_Position = pos;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  #define feather 0.5
  void main() {
    mediump vec3 pos = gl_FragCoord.xyz;
    mediump float alpha = abs(pos.x) < 0.1 || abs(pos.y) < 0.1 ? 0.5: 1.0;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }`;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = canvas.getContext("webgl", {
    antialias: true
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
  gl.uniformMatrix4fv(u_pmatrix, false, pMatrix);
  gl.uniformMatrix4fv(u_mvmatrix, false, mvMatrix);

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
  var p1 = new Point(50.0, 20.0);
  var p2 = new Point(120.0, 190.0);
  var p3 = new Point(200.0, 20.0);

  var vertices = new Float32Array([
    p1.x, p1.y,
    p2.x, p2.y,
    p3.x, p3.y
  ]);

  var n = 3; // The number of vertices

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
