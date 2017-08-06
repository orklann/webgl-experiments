// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_Normal;\n' +
  'attribute vec2 a_Direction;\n' +
  'varying vec2 v_Direction;\n' +
  'varying vec2 v_Normal;\n' +
  'uniform mat4 u_mvmatrix;\n' +
  'uniform mat4 u_pmatrix;\n' +
  'uniform mediump float u_lineWidth;\n' +
  'void main() {\n' +
  //'  const mat4 pMatrix = mat4(0.005 ,0,0,0, 0, -0.005,0,0, 0,0,1.0,1.0, -1.0,1.0,0,0);\n' +
  '  mediump float lineWidth = u_lineWidth + 1.0;\n' +
  '  vec4 delta = vec4(a_Normal * vec2(lineWidth/2.0), 0, 0);\n' +
  '  vec4 d = vec4(delta.xy, 0.0, 0.0);\n' +
  '  vec4 pos = u_pmatrix * u_mvmatrix * vec4((a_Position.xy + d.xy) / 1.0, 0, 1);\n' +
  '  gl_Position = pos;\n' +
  '  v_Normal = a_Normal;\n' +
  '  v_Direction = a_Direction;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#define feather 1.0\n' +
  'varying mediump vec2 v_Normal;\n' +
  'varying mediump vec2 v_Direction;\n' +
  'uniform mediump float u_lineWidth;\n' +
  'void main() {\n' +
  '  mediump float lineWidth = u_lineWidth + 0.5;\n' +
  '  mediump float dist = length(v_Normal) * lineWidth;\n' +
  '  mediump float alpha = dist < lineWidth - feather - feather? 1.0 :clamp(((lineWidth - dist) / feather / 2.0) , 0.0, 1.0);\n' +
  '  mediump float l = length(v_Direction);\n' +
  '  if (abs(l - 1.0) < 0.01) {\n' +
  '    alpha = abs(l - 1.0) * 10.0 + 0.2;\n' +
  '  }\n' +
  '  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);\n' +
  '}\n';

function main() {
  // Draw 2d canvas with testing
  var _2dCanvas = document.getElementById("2d");

  var ctx = _2dCanvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(100, 190);
  ctx.lineWidth = 4.0;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(190, 20);
  ctx.lineWidth = 4.0;
  ctx.stroke();

  // Retrieve <canvas> element
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

  var lineWidth = 4.0;
  var u_pmatrix = gl.getUniformLocation(gl.program, "u_pmatrix");
  var u_mvmatrix = gl.getUniformLocation(gl.program, "u_mvmatrix");
  var u_lineWidth = gl.getUniformLocation(gl.program, "u_lineWidth");
  gl.uniformMatrix4fv(u_pmatrix, false, pMatrix);
  gl.uniformMatrix4fv(u_mvmatrix, false, mvMatrix);
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
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function initVertexBuffers(gl) {
  var p1 = new Point(10.0, 10.0);
  var p2 = new Point(100.0, 190.0);

  var cwNormal = p2.sub(p1)._unit()._perp();
  var ccwNormal = cwNormal.mult(-1);
  var direction = p2.sub(p1)._unit();
  var inverseDirection = direction.mult(-1);
  var vertices = new Float32Array([
    10.0, 10.0, cwNormal.x, cwNormal.y, direction.x, direction.y,
    10.0, 10.0, ccwNormal.x, ccwNormal.y, direction.x, direction.y,
    100.0, 190.0, cwNormal.x, cwNormal.y, inverseDirection.x, inverseDirection.y,
    10.0, 10.0, ccwNormal.x, ccwNormal.y, direction.x, direction.y,
    100.0, 190.0, cwNormal.x, cwNormal.y, inverseDirection.x, inverseDirection.y,
    100.0, 190.0, ccwNormal.x, ccwNormal.y, inverseDirection.x, inverseDirection.y
  ]);
  var n = 4; // The number of vertices

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

  var a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }


  var a_Direction = gl.getAttribLocation(gl.program, "a_Direction");
  if (a_Direction < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 6, 0);
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_Normal, 2, gl.FLOAT, false, FSIZE * 6, 2 * FSIZE);
  gl.enableVertexAttribArray(a_Normal);

  gl.vertexAttribPointer(a_Direction, 2, gl.FLOAT, false, FSIZE * 6, 4 * FSIZE);
  gl.enableVertexAttribArray(a_Direction);
  return n;
}
