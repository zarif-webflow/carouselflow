import type { EmblaPluginType } from 'embla-carousel';
import type { EmblaOptionsType } from 'embla-carousel';
import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

import { detectChildrenReplacement } from './utils/detect-children-replacement';

const emblaParentSelector = '[data-carousel-parent]';
const emblaContainerSelector = '[data-carousel-container]';
const emblaSlideSelector = '[data-carousel-slide]';
const activeEmblaNodesSet: Set<HTMLElement> = new Set();

const isFinsweetCmsList = <T extends HTMLElement>(element: T) => {
  const targetElement =
    element.closest<HTMLElement>(
      '[fs-cmsfilter-element],[fs-cmsload-element],[fs-cmssort-element]'
    ) ||
    element.querySelector<HTMLElement>(
      '[fs-cmsfilter-element],[fs-cmsload-element],[fs-cmssort-element]'
    );

  if (!targetElement) return false;

  const isFinsweetCms = [
    targetElement.getAttribute('fs-cmsfilter-element'),
    targetElement.getAttribute('fs-cmsload-element'),
    targetElement.getAttribute('fs-cmssort-element'),
  ].some((val) => val && val.includes('list'));

  if (isFinsweetCms) return targetElement;

  return null;
};

const getEmblaNodes = <T extends HTMLElement>(parent?: T) =>
  Array.from((parent || document).querySelectorAll<HTMLElement>(emblaParentSelector));

const applyEmblaCarousel = <T extends HTMLElement>(emblaNode: T) => {
  if (activeEmblaNodesSet.has(emblaNode)) return;

  const dragFree = emblaNode.dataset.dragFree === 'true';
  const loop = emblaNode.dataset.loop === 'true';
  const autoPlay = emblaNode.dataset.autoPlay === 'true';

  const emblaContainer = emblaNode.querySelector<HTMLElement>(emblaContainerSelector);

  if (!emblaContainer) {
    console.error(`${emblaContainerSelector} wasn't found!`);
    return;
  }

  const emblaSlides = Array.from(emblaContainer.querySelectorAll<HTMLElement>(emblaSlideSelector));

  if (emblaSlides.length === 0) {
    console.error(`${emblaSlideSelector} wasn't found!`);
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

    emblaApi.on('reInit', () => {
      adjustButtons();
    });

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
    const finsweetCmsList = isFinsweetCmsList(emblaNode);

    if (finsweetCmsList) {
      detectChildrenReplacement(finsweetCmsList, emblaParentSelector, (emblaNodes) => {
        for (const emblaNode of emblaNodes) {
          applyEmblaCarousel(emblaNode);
          activeEmblaNodesSet.add(emblaNode);
        }
      });
    }
    applyEmblaCarousel(emblaNode);
    activeEmblaNodesSet.add(emblaNode);
  }
};

doFirstInit();
