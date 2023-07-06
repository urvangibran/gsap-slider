gsap.registerPlugin(ScrollTrigger);
const next = document.getElementById('next')
const prev = document.getElementById('prev')

next.addEventListener("click", () => scrubTo(scrub.vars.totalTime + cardSpacing));
prev.addEventListener("click", () => scrubTo(scrub.vars.totalTime - cardSpacing));

let iteration = 0;

const cardSpacing = 0.15;
const snap = gsap.utils.snap(cardSpacing);
const cards = gsap.utils.toArray('.cards li');
const seamlessLoop = buildSeamlessLoop(cards, cardSpacing);
const scrub = gsap.to(seamlessLoop, {
  totalTime: 0,
  duration: 0.9,
  ease: "power3",
  paused: true
});
const wrapScroll = (direction) => {
  iteration += direction;
  trigger.wrapping = true;

  if (direction > 0) {
    trigger.scroll(trigger.start + 1);
  } else {
    if (iteration < 0) {
      iteration = 9;
      seamlessLoop.totalTime(seamlessLoop.totalTime() + seamlessLoop.duration() * 10);
      scrub.pause();
    }
    trigger.scroll(trigger.end - 1);
  }
};

const onUpdateScroll = (self) => {
  const { progress, direction, wrapping } = self;

  if (progress === 1 && direction > 0 && !wrapping) {
    wrapScroll(1);
  } else if (progress < 1e-5 && direction < 0 && !wrapping) {
    wrapScroll(-1);
  } else {
    scrub.vars.totalTime = snap((iteration + progress) * seamlessLoop.duration());
    scrub.invalidate().restart();
    self.wrapping = false;
  }
};

const trigger = ScrollTrigger.create({
  start: 0,
  onUpdate: onUpdateScroll,
  pin: ".gallery"
});

const scrubTo = (totalTime) => {
  const progress = (totalTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();

  if (progress > 1) {
    wrapScroll(1);
  } else if (progress < 0) {
    wrapScroll(-1);
  } else {
    trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
  }
};

function buildSeamlessLoop(items, cardSpacing) {
  const overlap = Math.ceil(1 / cardSpacing);
  const startTime = items.length * cardSpacing + 0.5;
  const loopTime = (items.length + overlap) * cardSpacing + 1;

  const rawSequence = gsap.timeline({ paused: true });

  const seamlessLoop = gsap.timeline({
    paused: true,
    repeat: -1,
    onRepeat() {
      if (this._time === this._dur) {
        this._tTime += this._dur - 0.01;
      }
    },
  });

  const totalItems = items.length + overlap * 2;
  let time = 0;
  let index, item;

  gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

  for (let i = 0; i < totalItems; i++) {
    index = i % items.length;
    item = items[index];
    time = i * cardSpacing;

    rawSequence
      .fromTo(
        item,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          zIndex: 100,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: "power1.in",
          immediateRender: false,
        },
        time
      )
      .fromTo(
        item,
        { xPercent: 300 },
        { xPercent: -300, duration: 1, ease: "none", immediateRender: false },
        time
      );
  }

  rawSequence.time(startTime);

  seamlessLoop
    .to(rawSequence, {
      time: loopTime,
      duration: loopTime - startTime,
      ease: "none",
    })
    .fromTo(
      rawSequence,
      { time: overlap * cardSpacing + 1 },
      {
        time: startTime,
        duration: startTime - (overlap * cardSpacing + 1),
        immediateRender: false,
        ease: "none",
      }
    );

  return seamlessLoop;
}

