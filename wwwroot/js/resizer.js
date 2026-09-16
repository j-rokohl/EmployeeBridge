document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar-container');
  const resizer = document.getElementById('resizer');

  let x = 0;
  let w = 0;

  const onMouseMove = (e) => {
    // Calculate new width relative to mouse movement
    const dx = e.clientX - x;
    const newWidth = w + dx;

    // Apply width constraints (between 200px and 500px)
    if (newWidth >= 200 && newWidth <= 500) {
      sidebar.style.width = `${newWidth}px`;
    }
  };

  const onMouseUp = () => {
    // Remove temporary classes and active listeners
    resizer.classList.remove('resizing');
    document.body.classList.remove('resizing-active');

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseDown = (e) => {
    x = e.clientX;
    w = sidebar.getBoundingClientRect().width;

    resizer.classList.add('resizing');
    document.body.classList.add('resizing-active');

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  resizer.addEventListener('mousedown', onMouseDown);
});