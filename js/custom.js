// main variables that used in code
const slideContainer = document.querySelector('.slide__container .wrapper')
const rotateBlock = document.querySelector('.rotate__block');
const agreementButton = document.querySelector('.agree');
const nextSlideButton = document.querySelector('.arrow--next');
const prevSlideButton = document.querySelector('.arrow--prev');

// additional variables for timeout Ids
let slideSolvedActonTimeoutId;

// additional variables for arrows
const hiddenArrowClass = 'hidden';

// additional varibles for slides
const totalSlideAmount = 5;
const pathNames = Array.from(
  { length: totalSlideAmount }, (_, i) => ({ count: i + 1, pathName:`./slides/slide--${i + 1}.html` })
);

// additional function for detecting correct font-size
function heightDetect(percent) {
  const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  return (percent * (height - 6)) / 100;
}
function widthDetect(percent) {
  const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

  return (percent * width) / 100;
}
function setResponsiveFontSize() {
  $('.slide__container').css({
    'font-size': `clamp(1px, ${heightDetect(0.925925)}px,${widthDetect(0.520833)}px)`
  });
  $('.arrows').css({
    'font-size': `clamp(1px, ${heightDetect(0.925925)}px,${widthDetect(0.520833)}px)`
  });
}

// additional function to make request on the last slide
function lastSlideAction() {
  let id = $('#presentation', window.parent.document).attr('data-id');
  let $url = $('#presentation', window.parent.document).attr('data-request-url');
  let href = $('#presentation', window.parent.document).attr('data-href');
  let $token = $('meta[name="csrf-token"]', window.parent.document).attr('content');
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $token
    }
  });
  $.ajax({
    type: "POST",
    url: $url,
    data: {"id": id},
    success: function (data) {
      if (data !== false) {
        parent.location.href = href;
      }
    },
    error: function (data) {
      console.log(data);
    }
  });
}

// function that update info about prev/next button
function hideArrows() {
  $(nextSlideButton).addClass(hiddenArrowClass);
  $(prevSlideButton).addClass(hiddenArrowClass);
}

// function that detect oriental of device
function updateRotateBlockVisibility() {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;

  $(rotateBlock).toggleClass('visible', isPortrait);
}

// function that load slide without reloading page
async function loadComponent(componentPathName, slideNum) {
  const response = await fetch(componentPathName);
  const data = await response.text();

  slideContainer.innerHTML = data;
  gsap.from('.slide', { opacity: 0, duration: 1 });
  clearTimeout(slideSolvedActonTimeoutId);
  initDragabble(slideNum);

  $('.slide__product').on('touchstart', (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    initDragabble(slideNum);
  })
}

//window and document listeners
$(document).ready(function () {
  setResponsiveFontSize();
  updateRotateBlockVisibility();
});
$(window).on('resize', function () {
  setResponsiveFontSize();
  updateRotateBlockVisibility();
});
$(window).on('orientationchange', function () {
  updateRotateBlockVisibility();
});

// function that change slide on the screen
async function changeSlide(direction) {
  const currentSlideNum = slideContainer.getAttribute('data-current-slide');

  let newSlideNum;

  if (direction === 'next') {
    newSlideNum = Number(currentSlideNum) + 1;
  } else if (direction === 'prev') {
    newSlideNum = Number(currentSlideNum) - 1;
  }

  const { pathName } = pathNames.find(pathNameInfo => pathNameInfo.count === +newSlideNum);

  await loadComponent(pathName, newSlideNum);

  slideContainer.setAttribute('data-current-slide', newSlideNum);
  hideArrows();
}

// function that initiate change after slide task was solved
function slideSolvedAction (slideNum) {
  if (slideNum !== 1) {
    $(prevSlideButton).removeClass(hiddenArrowClass);
  }

  if (slideNum < totalSlideAmount) {
    $(nextSlideButton).removeClass(hiddenArrowClass);
  }

  if (slideNum === totalSlideAmount) {
    lastSlideAction();
  }
}

// button listeners
$(agreementButton).on('click', () => {
  loadComponent(pathNames[0].pathName, 1);
  slideContainer.setAttribute('data-current-slide', 1);
  hideArrows();
});
$(nextSlideButton).on('click', () => {
  changeSlide('next')
})
$(prevSlideButton).on('click', () => {
  changeSlide('prev')
});

// function init draggable and droppable events on slide
function initDragabble(currentSlideNum) {
  $(".slide__product").draggable({
    containment: '.slide__draggable-area',
    revert: "invalid",
    cursor: "move",
    helper: "clone",
  });

  $(".slide__slot").droppable({
    accept: function(draggable) {
      const productId = draggable.data("product-id");
      const correctProducts = $(this).data("correct-products");

      return correctProducts.includes(productId);
    },
    drop: function(event, ui) {
      const droppedProduct = ui.helper.clone();
      const currentProductId = droppedProduct.data("product-id");

      ui.helper.remove();
      droppedProduct[0].style.cssText = "";
      $(this).append(droppedProduct);

      droppedProduct.draggable({
        revert: "invalid",
        cursor: "move",
        start: function() {
          $(this).data("dropped", false);
        },
        stop: function() {
          if (!$(this).data("dropped")) {
            $(this).remove();
          }
        },
      }).draggable("disable");

      $(this).data("dropped", true);

      $(this).data("correct-products", $(this).data("correct-products").filter(item => item !== currentProductId))

      if (currentProductId === 9) {
        $(this).addClass('product--9');
      } else if (currentProductId === 10) {
        $(this).addClass('product--10');
      }

      if ($(this).data("correct-products").length === 0) {
        $(this).removeClass('half-active')
      }

      const isCurrentProductsIdsEmpty = $('.slide__slot')
        .map(function(index, element) {
          return $(element).data("correct-products").length === 0;
        })
        .get();

      if (!isCurrentProductsIdsEmpty.includes(false)) {
        slideSolvedActonTimeoutId = setTimeout(() => {
          slideSolvedAction(currentSlideNum);
        }, 1000);
      }
    },
  });
}
