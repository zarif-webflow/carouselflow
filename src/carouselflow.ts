import {
  addWFCustomPageLoadFeature,
  afterWebflowReady,
  getHtmlElement,
  getMultipleHtmlElements,
} from "@taj-wf/utils";
import type {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";
import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";

import { emblaEventListenersSet } from "./constants";

type CarouselInstance = {
  emblaNode: HTMLElement;
  api: EmblaCarouselType;
  abortController: AbortController;
};

let carouselInstances: Array<CarouselInstance> = [];

const SELECTORS = {
  parent: "[data-carousel-parent]",
  container: "[data-carousel-container]",
  slide: "[data-carousel-slide]",
  nextButton: "[data-carousel-next]",
  prevButton: "[data-carousel-prev]",
} as const;

const getEmblaNodes = <T extends HTMLElement>(parent?: T) =>
  getMultipleHtmlElements({ selector: SELECTORS.parent, parent });

const applyEmblaCarousel = <T extends HTMLElement>(emblaNode: T) => {
  const dragFree = emblaNode.dataset.dragFree === "true";
  const loop = emblaNode.dataset.loop === "true";
  const autoPlay = emblaNode.dataset.autoPlay === "true";
  const align = (emblaNode.dataset.emblaAlign || "center") as "start" | "center" | "end";
  const startIndex = Number.parseInt(emblaNode.dataset.emblaStartIndex || "0", 10);
  const lastSlideCenter = emblaNode.dataset.emblaLastSlideCenter;
  const emblaContainer = getHtmlElement({ selector: SELECTORS.container, parent: emblaNode });

  if (!emblaContainer) return;

  const emblaSlides = getMultipleHtmlElements({
    selector: SELECTORS.slide,
    parent: emblaContainer,
  });

  if (!emblaSlides) return;

  const exposedEventsValue = emblaNode.dataset.emblaExposedEvents;
  const targetExposedEvents = (
    exposedEventsValue
      ? exposedEventsValue
          .split(",")
          .filter((val) => emblaEventListenersSet.has(val as EmblaEventType))
      : []
  ) as EmblaEventType[];

  const options: EmblaOptionsType = {
    loop,
    dragFree,
    container: emblaContainer,
    slides: emblaSlides,
    align: align,
    startIndex,
    containScroll: lastSlideCenter === "false" ? undefined : false,
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

  const abortController = new AbortController();

  // Attach the API instance to the element for external access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (emblaNode as any).emblaApi = emblaApi;

  // Add this code to forward embla events to the emblaNode element
  if (targetExposedEvents.length > 0) {
    targetExposedEvents.forEach((eventName) => {
      emblaApi.on(eventName, (embla: EmblaCarouselType) => {
        // Create a custom event with the embla instance in the detail
        const customEvent = new CustomEvent(`embla:${eventName}`, {
          detail: { embla },
        });

        // Dispatch the event on the emblaNode element
        emblaNode.dispatchEvent(customEvent);
      });
    });
  }

  const nextButton = getHtmlElement({ selector: SELECTORS.nextButton, parent: emblaNode });
  const prevButton = getHtmlElement({ selector: SELECTORS.prevButton, parent: emblaNode });

  if (nextButton && prevButton) {
    // Prevent all relevant events from propagating to parent elements on both buttons
    const swipeEvents = [
      "mousedown",
      "mousemove",
      "mouseup",
      "touchstart",
      "touchmove",
      "touchend",
    ];

    // Apply to next button
    swipeEvents.forEach((eventType) => {
      nextButton.addEventListener(
        eventType,
        (event) => {
          event.stopPropagation();
        },
        {
          passive: eventType === "touchmove" || eventType === "mousemove",
          signal: abortController.signal,
        }
      );
    });

    // Apply to prev button
    swipeEvents.forEach((eventType) => {
      prevButton.addEventListener(
        eventType,
        (event) => {
          event.stopPropagation();
        },
        {
          passive: eventType === "touchmove" || eventType === "mousemove",
          signal: abortController.signal,
        }
      );
    });

    // Existing click handlers
    nextButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation(); // Stop event propagation to parent elements
        if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      },
      { capture: false, signal: abortController.signal }
    );
    prevButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation(); // Stop event propagation to parent elements
        if (emblaApi.canScrollPrev()) emblaApi.scrollPrev();
      },
      { capture: false, signal: abortController.signal }
    );

    // Existing button adjustment code
    const adjustButtons = () => {
      if (!emblaApi.canScrollNext()) {
        nextButton.classList.add("is-disable");
      } else {
        nextButton.classList.remove("is-disable");
      }

      if (!emblaApi.canScrollPrev()) {
        prevButton.classList.add("is-disable");
      } else {
        prevButton.classList.remove("is-disable");
      }
    };
    emblaApi.on("init", () => {
      adjustButtons();
    });

    emblaApi.on("reInit", () => {
      adjustButtons();
    });

    emblaApi.on("select", () => {
      adjustButtons();
    });
  }

  carouselInstances.push({ emblaNode, api: emblaApi, abortController });
};

const initializeCarousels = () => {
  const emblaNodes = getEmblaNodes();

  if (!emblaNodes) return;

  for (const emblaNode of emblaNodes) {
    applyEmblaCarousel(emblaNode);
  }
};

const destroyCarousels = () => {
  for (const carouselInstance of carouselInstances) {
    const { emblaNode, api, abortController } = carouselInstance;

    // Destroy the Embla instance
    api.destroy();

    // Abort any ongoing operations
    abortController.abort();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (emblaNode as any).emblaApi;
  }
  carouselInstances = [];
};

afterWebflowReady(() => {
  initializeCarousels();

  addWFCustomPageLoadFeature({
    name: "CAROUSELFLOW",
    async: false,
    init: initializeCarousels,
    destroy: destroyCarousels,
    reInit: () => {
      destroyCarousels();
      initializeCarousels();
    },
  });
});
