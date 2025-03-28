import type { EmblaPluginType } from 'embla-carousel';
import type { EmblaOptionsType } from 'embla-carousel';
import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

const init = () => {
  const allEmblaNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-carousel-parent]')
  );

  if (allEmblaNodes.length === 0) {
    console.log('[data-carousel-parent] count is 0');
    return;
  }

  for (const emblaNode of allEmblaNodes) {
    const dragFree = emblaNode.dataset.dragFree === 'true';
    const loop = emblaNode.dataset.loop === 'true';
    const autoPlay = emblaNode.dataset.autoPlay === 'true';

    const emblaContainer = emblaNode.querySelector<HTMLElement>('[data-carousel-container]');

    if (!emblaContainer) {
      console.error("[data-carousel-container] wasn't found!");
      return;
    }

    const emblaSlides = Array.from(
      emblaContainer.querySelectorAll<HTMLElement>('[data-carousel-slide]')
    );

    if (emblaSlides.length === 0) {
      console.error("[data-carousel-slider] wasn't found!");
      return;
    }

    const options: EmblaOptionsType = {
      loop,
      dragFree,
      container: emblaContainer,
      slides: emblaSlides,
    };

    const plugins: EmblaPluginType[] = [];

    if (autoPlay) {
      plugins.push(
        Autoplay({
          stopOnFocusIn: false,
          stopOnInteraction: false,
          stopOnLastSnap: false,
          stopOnMouseEnter: false,
        })
      );
    }

    const emblaApi = EmblaCarousel(emblaNode, options, plugins);

    const nextButton = emblaNode.querySelector<HTMLElement>('[data-carousel-next]');
    const prevButton = emblaNode.querySelector<HTMLElement>('[data-carousel-prev]');

    if (nextButton && prevButton) {
      nextButton.addEventListener('click', () => emblaApi.scrollNext(), false);
      prevButton.addEventListener('click', () => emblaApi.scrollPrev(), false);
    }
  }
};

init();
