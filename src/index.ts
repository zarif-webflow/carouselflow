import type { EmblaPluginType } from 'embla-carousel';
import type { EmblaOptionsType } from 'embla-carousel';
import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

import type { CMSFilters } from './types/CMSFilters';

const activeEmblaNodesSet: Set<HTMLElement> = new Set();

const isFinsweetCmsList = <T extends HTMLElement>(element: T): boolean => {
  const targetElement =
    element.closest<HTMLElement>(
      '[fs-cmsfilter-element],[fs-cmsload-elemen],[fs-cmssort-element]'
    ) ||
    element.querySelector<HTMLElement>(
      '[fs-cmsfilter-element],[fs-cmsload-elemen],[fs-cmssort-element]'
    );

  if (!targetElement) return false;

  return [
    targetElement.getAttribute('fs-cmsfilter-element'),
    targetElement.getAttribute('fs-cmsload-element'),
    targetElement.getAttribute('fs-cmssort-element'),
  ].some((val) => val && val.includes('list'));
};

const getEmblaNodes = <T extends HTMLElement>(parent?: T) =>
  Array.from((parent || document).querySelectorAll<HTMLElement>('[data-carousel-parent]'));

const applyEmblaCarousel = <T extends HTMLElement>(emblaNode: T) => {
  if (activeEmblaNodesSet.has(emblaNode)) return;

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
    console.error("[data-carousel-slide] wasn't found!");
    return;
  }

  const options: EmblaOptionsType = {
    loop,
    dragFree,
    container: emblaContainer,
    slides: emblaSlides,
    align: 'start',
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

    const adjustButtons = () => {
      if (!emblaApi.canScrollNext()) {
        nextButton.classList.add('is-disable');
      } else {
        nextButton.classList.remove('is-disable');
      }

      if (!emblaApi.canScrollPrev()) {
        prevButton.classList.add('is-disable');
      } else {
        prevButton.classList.remove('is-disable');
      }
    };

    adjustButtons();

    emblaApi.on('select', () => {
      adjustButtons();
    });
  }
};

const doFirstInit = () => {
  const emblaNodes = getEmblaNodes();

  if (emblaNodes.length === 0) {
    console.log('[data-carousel-parent] count is 0');
    return;
  }

  for (const emblaNode of emblaNodes) {
    if (isFinsweetCmsList(emblaNode)) continue;
    applyEmblaCarousel(emblaNode);
    activeEmblaNodesSet.add(emblaNode);
  }
};

doFirstInit();

/**
 *  Check for finsweet cms carousels
 */
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  'cmsfilter',
  (cmsFltInstances: CMSFilters[]) => {
    for (const cmsFlt of cmsFltInstances) {
      cmsFlt.listInstance.on('renderitems', () => {
        const cmsWrapper = cmsFlt.listInstance.list;

        if (!cmsWrapper) return;

        const emblaNodes = getEmblaNodes(cmsWrapper);

        for (const emblaNode of emblaNodes) {
          applyEmblaCarousel(emblaNode);
          activeEmblaNodesSet.add(emblaNode);
        }
      });
    }
  },
]);
