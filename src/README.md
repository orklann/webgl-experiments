# On antialiasing
  - #1 https://abandonedwig.info/blog/2013/02/24/edge-distance-anti-aliasing.html
  - #2 https://blog.mapbox.com/drawing-antialiased-lines-with-opengl-8766f34192dc

Method #2 is better than #2.

1 Expand triangle edge by less than one pixel, and turn on OpenGL antialiasing
  Resulting all the same alpha for antialiazing

2 Interpolating alpha (0.0 to 1.0) between `lineWidth - feather` and `lineWidth + feather`
  Resulting better alphas
