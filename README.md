# NEURAL SERPENT // SYSTEM BREACH

> Because literally everyone has a snake game now, so this one had to overcompensate and become a hostile AI experiment.

![Behold the beauty](docs/splash.png)

---

## What is this?

This is **Snake**, if Snake had:
- An angry AI overlord doing running commentary on your poor life choices  
- Danger zones, power‑ups, and escalating chaos in a neon CRT chamber  
- A terminal‑core aesthetic that looks like it escaped from a late‑90s hacking movie

You pilot a glowing neural serpent inside a containment chamber. Your job:
- Eat glowing payloads (apples)  
- Avoid walls, your own tail, and lethal hazard zones  
- Pretend you are in control while the system quietly logs your “performance”

The interface screams things like `CONTAINMENT_CHAMBER`, `NEURAL_MASS`, and `ARCHIVE_LOG` because subtlety was not invited.

---

## Controls

- Arrow keys – steer the neural serpent  
- Space – pause / resume the protocol  
- Mouse – mostly for clicking the **INITIATE** and **SUSPEND** buttons, if you’re feeling theatrical

---

## Features

- **Overdramatic UI**: Glitch text, scanlines, CRT haze, and HUD overlays that take themselves far too seriously.  
- **Dynamic hazards**: Danger zones appear, shift, and generally try to ruin your day.  
- **Power‑ups**: Temporary buffs like invincibility, speed boosts, and score multipliers – all accompanied by snark from the AI.  
- **Session analytics**: Tracks games played, total score, apples eaten, and more, so the machine can judge you with data.  
- **Leaderboard archive**: A high‑score panel so you can see exactly who to blame for setting unrealistic standards.

---

## Running the game

Everything is front‑end only:

1. Serve the folder with a static file server (or use the go‑to Python one):  
   ```bash
   python -m http.server 8000
   ```  
2. Open `http://localhost:8000` in your browser.  
3. Hit **INITIATE** and accept your fate.

Alternatively, many editors have a “Live Server” extension; pointing that at `index.html` works just as well.

---

## Tech stack

- Plain old `index.html` for the layout  
- `static/css/style.css` for all the cyberpunk drama  
- `static/js/game.js` for the snake logic, power‑ups, danger zones, and the AI’s mean little status messages  
- No frameworks, no build step, just vibes and JavaScript

---

## FAQ

**Q: Why does this exist?**  
Because I wanted it too. It was time for a dramatically over‑engineered snake game.

**Q: Is the AI actually judging me?**  
Yes. Constantly. It has opinions about your wall‑collision rate.

**Q: Is this production‑ready?**  
Only if your production environment is an underground lab with questionable ethics.

---

## Contributing

Contributions are welcome, especially if they:
- Make the AI more sarcastic  
- Add new power‑ups or hazards  
- Introduce even more unnecessary animations and glowy bits

Just try not to make the snake _too_ good. The rest of us still need to feel something vaguely resembling success.

---

## License

Use it, tweak it, break it, make it inspiration for your own overly dramatic snake variant. Do we really need a license. 

