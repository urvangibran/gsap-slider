gsap.registerPlugin(ScrollTrigger);
const next = document.getElementById('next')
const prev = document.getElementById('prev')

next.addEventListener("click", () => scrubTo(scrub.vars.totalTime + card_spacing));
prev.addEventListener("click", () => scrubTo(scrub.vars.totalTime - card_spacing));

let iteration = 0;

const card_spacing = 0.1;
const snap = gsap.utils.snap(card_spacing);
const cards = gsap.utils.toArray('.cards li');
const seamlessLoop = buildSeamlessLoop(cards, card_spacing);
const scrub = gsap.to(seamlessLoop, {
    totalTime: 0,
    duration: 0.9,
    ease: "power3",
    paused: true
});
const trigger = ScrollTrigger.create({
    start: 0,
    onUpdate(self) {
        if (self.progress === 1 && self.direction > 0 && !self.wrapping)
            wrapForward(self);
        else if (self.progress < 1e-5 && self.direction < 0 && !self.wrapping)
            wrapBackward(self);
        else {
            scrub.vars.totalTime = snap((iteration + self.progress) * seamlessLoop.duration());
            scrub.invalidate().restart();
            self.wrapping = false;
        }
    },
    end: "+=3000",
    pin: ".gallery"
});

const wrapForward = (trigger) => {
    iteration++;
    trigger.wrapping = true;
    trigger.scroll(trigger.start + 1);
}

const wrapBackward = (trigger) => {
    iteration--;
    if (iteration < 0) {
        iteration = 9;
        seamlessLoop.totalTime(seamlessLoop.totalTime() + seamlessLoop.duration() * 10);
        scrub.pause();
    }
    trigger.wrapping = true;
    trigger.scroll(trigger.end - 1);
}

const scrubTo = (totalTime) => {
    let progress = (totalTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();
    if (progress > 1) { 
        wrapForward(trigger);
    } else if (progress < 0) {
        wrapBackward(trigger);
    } else {
        trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
    }
}

function buildSeamlessLoop(items, card_spacing) {
    let overlap = Math.ceil(1 / card_spacing),
        startTime = items.length * card_spacing + 0.5,
        loopTime = (items.length + overlap) * card_spacing + 1,
        rawSequence = gsap.timeline({ paused: true }),
        seamlessLoop = gsap.timeline({
            paused: true,
            repeat: -1,
            onRepeat() {
                this._time === this._dur && (this._tTime += this._dur - 0.01);
            }
        }),
        l = items.length + overlap * 2,
        time = 0,
        i, index, item;

    gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

    for (i = 0; i < l; i++) {
        index = i % items.length;
        item = items[index];
        time = i * card_spacing;
        rawSequence.fromTo(item, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false }, time)
            .fromTo(item, { xPercent: 400 }, { xPercent: -400, duration: 1, ease: "none", immediateRender: false }, time);
        i <= items.length && seamlessLoop.add("label" + i, time);
    }

    rawSequence.time(startTime);
    seamlessLoop.to(rawSequence, {
        time: loopTime,
        duration: loopTime - startTime,
        ease: "none"
    }).fromTo(rawSequence, { time: overlap * card_spacing + 1 }, {
        time: startTime,
        duration: startTime - (overlap * card_spacing + 1),
        immediateRender: false,
        ease: "none"
    });
    return seamlessLoop;
}
