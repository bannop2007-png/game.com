function randomScare(jumpscare, overlay){
  if(Math.random() < 0.001){
    jumpscare.play();
    overlay.style.background='rgba(255,0,0,0.5)';
    setTimeout(()=>overlay.style.background='radial-gradient(circle at center, rgba(0,0,0,0) 150px, rgba(0,0,0,0.95) 300px)', 200);
  }
}
