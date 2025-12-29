document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const dots = document.querySelectorAll(".dot");

  let currentIndex = 0;
  let startX = 0;
  let isDragging = false;

  function updateCarousel(index) {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(dot => dot.classList.remove("active"));
    dots[index].classList.add("active");
    currentIndex = index;
  }

  // Dot click
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => updateCarousel(index));
  });

  // Touch events
  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  track.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (diff > 50 && currentIndex < slides.length - 1) {
      updateCarousel(currentIndex + 1);
    } else if (diff < -50 && currentIndex > 0) {
      updateCarousel(currentIndex - 1);
    }

    isDragging = false;
  });
});
