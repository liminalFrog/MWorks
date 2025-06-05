// Debug script to help diagnose grid visibility issues
console.log('Debug Canvas Script Running');

// Add this to your HTML to debug
/*
<canvas id="debug-canvas" width="500" height="500" style="border: 1px solid black;"></canvas>
<script>
  const canvas = document.getElementById('debug-canvas');
  const ctx = canvas.getContext('2d');
  
  // Draw simple grid with our new colors
  const inchGridColor = '#e5e7eb';
  const feetGridColor = '#d1d5db';
  const fiveFeetGridColor = '#9ca3af';
  const tenFeetGridColor = '#6b7280';
  
  // Draw inch grid
  ctx.strokeStyle = inchGridColor;
  ctx.lineWidth = 0.8;
  
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw foot grid
  ctx.strokeStyle = feetGridColor;
  ctx.lineWidth = 1.0;
  
  for (let x = 0; x < canvas.width; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += 240) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw 5-foot grid
  ctx.strokeStyle = fiveFeetGridColor;
  ctx.lineWidth = 1.2;
  
  for (let x = 0; x < canvas.width; x += 1200) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += 1200) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  console.log('Debug canvas drawn');
</script>
*/
