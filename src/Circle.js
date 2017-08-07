// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_Normal;
  varying vec2 v_Normal;
  uniform mat4 u_mvmatrix;
  uniform mat4 u_pmatrix;
  uniform mediump float u_lineWidth;
  void main() {
    mediump float lineWidth = u_lineWidth + 1.0; // Add 1 pixel to line width for better looking
    vec4 pos = u_pmatrix * u_mvmatrix * vec4(a_Position.xy / 1.0, 0, 1);
    gl_Position = pos;
    v_Normal = a_Normal;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  #define feather 1.0
  varying mediump vec2 v_Normal;
  uniform mediump float u_lineWidth;
  void main() {
    mediump float lineWidth = u_lineWidth + 0.5;
    mediump float dist = length(v_Normal) * lineWidth;
    mediump float alpha = dist < lineWidth - feather - feather? 1.0 :clamp(((lineWidth - dist) / feather / 2.0) , 0.0, 1.0);
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }`;

var lineWidth = 4.0;

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
  ctx.beginPath();
  ctx.arc(100, 75, 50, 0, 1.5 * Math.PI);
  ctx.lineTo(200, 100);
  ctx.lineTo(250, 250);
  //ctx.lineTo(100, 75);
  ctx.lineWidth = 4.0;
  ctx.fill();

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
  gl.drawArrays(gl.TRIANGLES, 0, 12);
}

function initVertexBuffers(gl) {
  var p1 = new Point(50.0, 20.0);
  var p2 = new Point(120.0, 190.0);
  var p3 = new Point(200.0, 20.0);

  var cwNormal_p1p2 = p2.sub(p1)._unit()._perp();
  var ccwNormal_p1p2 = cwNormal_p1p2.mult(-1);
  var direction_p1p2 = p2.sub(p1)._unit();
  var inverseDirection_p1p2 = direction_p1p2.mult(-1);

  var cwNormal_p2p3 = p3.sub(p2)._unit()._perp();
  var ccwNormal_p2p3 = cwNormal_p2p3.mult(-1);
  var direction_p2p3 = p3.sub(p2)._unit();
  var inverseDirection_p2p3 = direction_p2p3.mult(-1);

  var joinNormal = cwNormal_p1p2.add(cwNormal_p2p3);
  var cosHalfAngle = (cwNormal_p2p3.x * joinNormal.x) + (cwNormal_p2p3.y * joinNormal.y);
  var miterLengthRatio = 1 / cosHalfAngle;

  // Calculate 6 points to form 2 lines
  var startPoint1 = p1.add(cwNormal_p1p2.mult(lineWidth / 2.0));
  var startPoint2 = p1.add(ccwNormal_p1p2.mult(lineWidth / 2.0));
  var miterVector = joinNormal.mult(miterLengthRatio * lineWidth / 2.0);
  var extrudePointUp = p2.add(miterVector);
  var extrudePointDown = p2.add(miterVector.mult(-1));
  var endPoint1 = p3.add(cwNormal_p2p3.mult(lineWidth / 2.0));
  var endPoint2 = p3.add(ccwNormal_p2p3.mult(lineWidth / 2.0));

  var vertices = new Float32Array([
    // Line 1
    startPoint1.x, startPoint1.y, cwNormal_p1p2.x, cwNormal_p1p2.y,
    startPoint2.x, startPoint2.y, ccwNormal_p1p2.x, ccwNormal_p1p2.y,
    extrudePointDown.x, extrudePointDown.y, ccwNormal_p1p2.x, ccwNormal_p1p2.y,
    extrudePointDown.x, extrudePointDown.y, ccwNormal_p1p2.x, ccwNormal_p1p2.y,
    extrudePointUp.x, extrudePointUp.y, cwNormal_p1p2.x, cwNormal_p1p2.y,
    startPoint1.x, startPoint1.y, cwNormal_p1p2.x, cwNormal_p1p2.y,

    // Line 2
    endPoint1.x, endPoint1.y, cwNormal_p2p3.x, cwNormal_p2p3.y,
    endPoint2.x, endPoint2.y, ccwNormal_p2p3.x, ccwNormal_p2p3.y,
    extrudePointDown.x, extrudePointDown.y, ccwNormal_p2p3.x, ccwNormal_p2p3.y,
    extrudePointDown.x, extrudePointDown.y, ccwNormal_p2p3.x, ccwNormal_p2p3.y,
    extrudePointUp.x, extrudePointUp.y, cwNormal_p2p3.x, cwNormal_p2p3.y,
    endPoint1.x, endPoint1.y, cwNormal_p2p3.x, cwNormal_p2p3.y
  ]);
  var n = 12; // The number of vertices

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

  /*
  var a_Direction = gl.getAttribLocation(gl.program, "a_Direction");
  if (a_Direction < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  */

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_Normal, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_Normal);

  return n;
}
