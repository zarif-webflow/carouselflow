import type {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";
import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";

import { emblaEventListenersSet } from "./constants";
import { detectChildrenReplacement } from "./utils/detect-children-replacement";

const emblaParentSelector = "[data-carousel-parent]";
const emblaContainerSelector = "[data-carousel-container]";
const emblaSlideSelector = "[data-carousel-slide]";
const activeEmblaNodesSet: Set<HTMLElement> = new Set();

const isFinsweetCmsList = <T extends HTMLElement>(element: T) => {
  const targetElement =
    element.closest<HTMLElement>(
      "[fs-cmsfilter-element],[fs-cmsload-element],[fs-cmssort-element]"
    ) ||
    element.querySelector<HTMLElement>(
      "[fs-cmsfilter-element],[fs-cmsload-element],[fs-cmssort-element]"
    );

  if (!targetElement) return false;

  const isFinsweetCms = [
    targetElement.getAttribute("fs-cmsfilter-element"),
    targetElement.getAttribute("fs-cmsload-element"),
    targetElement.getAttribute("fs-cmssort-element"),
  ].some((val) => val && val.includes("list"));

  if (isFinsweetCms) return targetElement;

  return null;
};

const getEmblaNodes = <T extends HTMLElement>(parent?: T) =>
  Array.from((parent || document).querySelectorAll<HTMLElement>(emblaParentSelector));

const applyEmblaCarousel = <T extends HTMLElement>(emblaNode: T) => {
  if (activeEmblaNodesSet.has(emblaNode)) return;

  const dragFree = emblaNode.dataset.dragFree === "true";
  const loop = emblaNode.dataset.loop === "true";
  const autoPlay = emblaNode.dataset.autoPlay === "true";
  const align = (emblaNode.dataset.emblaAlign || "center") as "start" | "center" | "end";
  const startIndex = Number.parseInt(emblaNode.dataset.emblaStartIndex || "0", 10);
  const lastSlideCenter = emblaNode.dataset.emblaLastSlideCenter;
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

  const nextButton = emblaNode.querySelector<HTMLElement>("[data-carousel-next]");
  const prevButton = emblaNode.querySelector<HTMLElement>("[data-carousel-prev]");

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
        { passive: eventType === "touchmove" || eventType === "mousemove" }
      );
    });

    // Apply to prev button
    swipeEvents.forEach((eventType) => {
      prevButton.addEventListener(
        eventType,
        (event) => {
          event.stopPropagation();
        },
        { passive: eventType === "touchmove" || eventType === "mousemove" }
      );
    });

    // Existing click handlers
    nextButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation(); // Stop event propagation to parent elements
        if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      },
      false
    );
    prevButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation(); // Stop event propagation to parent elements
        if (emblaApi.canScrollPrev()) emblaApi.scrollPrev();
      },
      false
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
};

const doFirstInit = () => {
  const emblaNodes = getEmblaNodes();

  if (emblaNodes.length === 0) {
    console.debug("[data-carousel-parent] count is 0");
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
