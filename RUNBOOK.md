# Tri-Quest event-day runbook

**NIET Orientation 2026 · Sunday 20 September · about 60 minutes · 60 questions in 8 levels**

The show runs **offline from the host laptop**, mirrored to the projector. The GitHub Pages copy (https://ashokgit.github.io/tri-quest/) is only a backup, because it needs internet. Keep that link private until the event: anyone who has it can read the answers.

---

## Saturday: the day before

- [ ] **Media:** put all files from [MEDIA.md](MEDIA.md) in place, then run `npm run check:event`. It must show no ✖.
- [ ] **Verification:** get the signed-off sheet back (home page → Verification sheet) and fix any corrections in `public/data/questions.json`.
- [ ] **Slide check:** home page → Tri-Quest → *Slide check*. It should read "0 with errors". Look through the media questions by eye too.
- [ ] **Review the draw:** home page → *Review* shows the 60 questions that will appear. If you reshuffle, copy the new draw number into `"seed"` in `public/data/sessions/tri-quest.json`, so every device agrees.
- [ ] **Build the offline copy:** `npm run build`, then commit and push, so the backup site matches.
- [ ] **Rehearsal on the real projector and speakers**, if you can get into the hall:
  - [ ] Readable from the back row?
  - [ ] Sound check page (`#/sounds`): set the volume on the hall speakers.
  - [ ] Clicker test (see below).
- [ ] **Brief the volunteers** (see "Running a question").
- [ ] **Print** the host cheat sheet (Review → Print) and the controls card (at the end of this page).

## Sunday: setup (at least 45 minutes before)

**Laptop (macOS)**
- [ ] Plug in the charger.
- [ ] Turn on **Do Not Disturb** (Control Centre → Focus).
- [ ] Quit Slack, WhatsApp, Mail and anything else that might pop up.
- [ ] Keep the screen awake: in Terminal, run `caffeinate -d` and leave it open until the show ends.
- [ ] **Displays:** System Settings → Displays → **Mirror** the projector. Use 1920×1080 if the projector supports it; any size works, but it will letterbox.

**Start the quiz offline**
- [ ] In Terminal, in the project folder: `npm run preview`. Leave it running.
- [ ] Open **Chrome** at http://localhost:4173.
- [ ] **Turn Wi-Fi off** and reload once, to prove it runs offline.
- [ ] Home page:
  - [ ] **Order** is *By difficulty*.
  - [ ] **Questions** is the number you want (default 80). − / + change it in steps of 5; the rounds share them in proportion, and must-have questions are always in.
  - [ ] The button says **Present →**, not "Resume". If it says Resume, press **Home** inside the show to go back to the welcome screen.

**Sound**
- [ ] Sound output: System Settings → Sound → Output → the hall (HDMI or the mixer's line in).
- [ ] Mac volume near maximum. Control the loudness on the hall mixer.
- [ ] Sound check page: play the **Opening theme** and **Countdown tick**, and adjust.

**Open the show**
- [ ] Click **Present →**. It opens in full screen automatically. If it doesn't, move the mouse and click **⛶ Full screen** in the bottom-right corner, or press **F**.
- [ ] The welcome screen stays up while students arrive.
- [ ] Sound starts on the first key press. The first **→** plays the opening theme, so that's your "let's begin".

## Running a question

| Step | Host (keyboard or clicker) | On screen | Volunteers |
|---|---|---|---|
| 1 | **→** | Question appears | Watch the room |
| 2 | **→** | Answers slide in, clock starts, music builds | Students think |
| 3 | *(wait)* | Last 5 s tick → **✋ HANDS UP!** | Pick a student with their hand up |
| 4 | **A / B / C / D** for the student's answer | Answer turns amber, clock stops, suspense drone | Hold the mic for the student |
| 5 | **R** (or →) | Correct answer flashes green, a wrong pick turns red, explanation shows | Give the prize if correct |
| 6 | **→** | Next question | |

**Variations:**
- **Open questions** have no options: take answers from hands up, then press **R**.
- **Picture questions:** each **→** makes the image clearer before the options appear.
- **Options come in by themselves** 1.5 s after a question lands (press → to bring them sooner). Blur/zoom pictures still wait for you to step through the clues.
- **Audio, video and YouTube questions:** press **P** to play (and to replay). The clock starts on the first **P**, not before (or press **T**). There's no clock music under clips, except the muted YouTube ones. The three YouTube clips **need the hall PC online**: Cobweb and Unko Sweater play muted and replay with sound on the reveal; the sarangi plays sound only (the picture shows on the reveal).
- **Jump to a question:** on the *Slide check* page every question in the current draw has a **▶ Go to** button that opens the show right there.
- **A wrong lock-in:** press the same letter again to unlock, then lock a different answer before revealing.
- **Nobody knows:** just press **R**.

## Keeping time

- Plan: about 55 minutes of questions, plus about 5 minutes of buffer.
- Running late:
  - **N** skips the current question.
  - **1–8** jumps straight to a level's title card.
  - **−** takes 10 s off the clock.
- A question needs longer: **+** adds 10 s, and **T** pauses or resumes the clock.

## If something goes wrong

| Problem | Fix |
|---|---|
| No sound | Press any key (browsers need one before audio). Check for the 🔇 icon in the corner and press **M**. Check the Mac's sound output. |
| Pressed a key by mistake | **←** steps back. Nothing replays loudly going backwards. |
| Tab closed, crash or reboot | Reopen http://localhost:4173 and press Present/Resume. **It resumes at the same question.** |
| Need the audience's attention | **.** blanks the screen. Press **.** or **Esc** to bring it back. |
| "Missing media" orange box | Press **N** to skip the question. |
| The clicker's "blank" button locks answer B | Some clickers send **B** for blank. Use the laptop's **.** key instead (see the clicker test). |
| Laptop dies | Second laptop: https://ashokgit.github.io/tri-quest/ (needs internet), Resume from the same level with **1–8**. |
| Projector crops the edges | Set the Mac display to 1920×1080 (mirrored). |

## Clicker test

Most presentation clickers send **Page Down / Page Up**, which Tri-Quest treats as next/back. Some also have a "blank" button: if it sends **.**, it blanks the screen. If it sends **B**, it will **lock answer B**, so avoid that button. Test every button during the rehearsal.

## After the show

- Press **Home** to return to the welcome screen, or go to the home page and switch order to reset.
- The finale slide stays up for photos. 🎉

---

## Host controls card (print and keep by the laptop)

| Key | Action |
|---|---|
| **→ / Space / PgDn** | Next step |
| **← / PgUp** | Back |
| **A B C D** | Lock the student's answer (amber). Same key again to unlock |
| **R** | Reveal the answer |
| **N** | Skip question |
| **T** | Pause / resume the clock |
| **+ / −** | ±10 seconds |
| **P** | Play / pause audio or video |
| **1–9** | Jump to level (level 10, if there is one: use ▶ Go to on the Slide check) |
| **Home** | Back to the welcome screen |
| **.** | Blank screen |
| **M** | Mute |
| **F** | Full screen (or move the mouse → ⛶ button, bottom-right) |
| **H** | Show all controls on screen (audience sees it) |
