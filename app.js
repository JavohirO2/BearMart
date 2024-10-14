const headerImg = document.querySelector('.head');
const leftBtn = document.querySelector('.left-btn');
const rightBtn = document.querySelector('.right-btn');
const radios = document.querySelectorAll('.slider-radio');

const UPDATE_TIME_INTERVAL = 3000;

const imagesArray = [
  "./Photos/RollingAd1.jpg",
  "./Photos/RollingAd2.png",
  "./Photos/RollingAd3.png",
];

let i = 0;

// Function to update the image and the corresponding radio button
function updateImage(index) {
  headerImg.src = imagesArray[index];
  radios[index].checked = true; // Check the radio button for the current slide
}

// Automatically update the image every 3 seconds
let sliderInterval = setInterval(() => {
  i = (i + 1) % imagesArray.length;
  updateImage(i);
}, UPDATE_TIME_INTERVAL);

// Left button click event
leftBtn.addEventListener('click', () => {
  i = (i - 1 + imagesArray.length) % imagesArray.length; // Loop backwards
  updateImage(i);
  resetInterval();
});

// Right button click event
rightBtn.addEventListener('click', () => {
  i = (i + 1) % imagesArray.length; // Loop forwards
  updateImage(i);
  resetInterval();
});

// Radio button click event
radios.forEach((radio, index) => {
  radio.addEventListener('click', () => {
    i = index; // Set i to the clicked radio button's index
    updateImage(i);
    resetInterval();
  });
});

// Function to reset the interval timer when buttons or radio buttons are clicked
function resetInterval() {
  clearInterval(sliderInterval);
  sliderInterval = setInterval(() => {
    i = (i + 1) % imagesArray.length;
    updateImage(i);
  }, UPDATE_TIME_INTERVAL);
}