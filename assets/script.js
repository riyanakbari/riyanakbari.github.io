const sections = document.querySelectorAll("section");
const navLi = document.querySelectorAll("nav .container ul li");

window.onscroll = () => {
  var current = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  navLi.forEach((li) => {
    li.classList.remove("active");
    if (li.id === `${current}-li`) {
      li.classList.add("active");
    }
  });
};
