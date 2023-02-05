Object.defineProperty(Array.prototype, 'mapComp', {
  value: function (callbackFn) {
    return this.map(callbackFn).join('');
  },
});
// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  getTracks().then((tracks) => {
    const html = renderTrackCards(tracks);
    renderAt('#tracks', html);
  });

  getRacers().then((racers) => {
    const html = renderRacerCars(racers);
    renderAt('#racers', html);
  });
}

function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      const { target } = event;
      // Race track form field
      let element;
      if ((element = target.closest('.card.track'))) {
        handleSelectTrack(element);
      }

      // Podracer form field
      if ((element = target.closest('.card.podracer'))) {
        handleSelectPodRacer(element);
      }

      // Submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault();
        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate();
      }
    },
    false
  );
}

async function delay(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  const race = await createRace(store.player_id, store.track_id);
  store.race_id = race.ID - 1;
  renderAt('#race', renderRaceStartView(race.Track));

  await runCountdown();
  await startRace(store.race_id);
  await runRace(store.race_id);
}

function runRace(raceID) {
  return new Promise(async (resolve) => {
    const raceInterval = setInterval(async () => {
      const race = await getRace(raceID);
      if (race.status === 'in-progress') {
        renderAt('#leaderBoard', raceProgress(race.positions));
      } else if (race.status === 'finished') {
        clearInterval(raceInterval); // to stop the interval from repeating
        renderAt('#race', resultsView(race.positions)); // to render the results view
        resolve(race); // resolve the promise
      }
    }, 500);
  });
  // remember to add error handling for the Promise
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      const timerInterval = setInterval(
        () => {
          document.getElementById('big-numbers').innerHTML = --timer;
          if (timer === 0) {
            clearInterval(timerInterval);
            resolve();
          }
        },
        1000,
        true
      );
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectPodRacer(target) {
  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');

  store.player_id = Number(target.id);
}

function handleSelectTrack(target) {
  console.log('selected a track', target.id);

  // remove class selected from all track options
  const selected = document.querySelector('#tracks .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');

  store.track_id = target.id;
}

async function handleAccelerate() {
  console.log('accelerate button clicked');
  await accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			  <h4>Loading Racers...</4>
		  `;
  }

  const results = racers.mapComp(renderRacerCard);

  return `
		  <ul id="racers">
			  ${results}
		  </ul>
	  `;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		  <li class="card podracer" id="${id}">
			  <h3>${driver_name}</h3>
			  <p>${top_speed}</p>
			  <p>${acceleration}</p>
			  <p>${handling}</p>
		  </li>
	  `;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			  <h4>Loading Tracks...</4>
		  `;
  }

  const results = tracks.mapComp(renderTrackCard);

  return `
		  <ul id="tracks">
			  ${results}
		  </ul>
	  `;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		  <li id="${id}" class="card track">
			  <h3>${name}</h3>
		  </li>
	  `;
}

function renderCountdown(count) {
  return `
		  <h2>Race Starts In...</h2>
		  <p id="big-numbers">${count}</p>
	  `;
}

function renderRaceStartView(track, racers) {
  return `
		  <header>
			  <h1>Race: ${track.name}</h1>
		  </header>
		  <main id="two-columns">
			  <section id="leaderBoard">
				  ${renderCountdown(3)}
			  </section>

			  <section id="accelerate">
				  <h2>Directions</h2>
				  <p>Click the button as fast as you can to make your racer go faster!</p>
				  <button id="gas-peddle">Click Me To Win!</button>
			  </section>
		  </main>
		  <footer></footer>
	  `;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		  <header>
			  <h1>Race Results</h1>
		  </header>
		  <main>
			  ${raceProgress(positions)}
			  <a href="/race">Start a new race</a>
		  </main>
	  `;
}

function raceProgress(positions) {
  let userPlayer = positions.find((e) => e.id === store.player_id);
  userPlayer.driver_name += ' (you)';

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.mapComp((p) => {
    return `
			  <tr>
				  <td>
					  <h3>${count++} - ${p.driver_name}</h3>
				  </td>
			  </tr>
		  `;
  });

  return `
		  <main>
			  <h3>Leaderboard</h3>
			  <section id="leaderBoard">
				  ${results}
			  </section>
		  </main>
	  `;
}

function renderToast(type, message) {
  const toastMarkup = `
		  <span>${message}</span>
	`;
  const element = document.getElementById('toast');
  element.className = `show ${type}`;
  setTimeout(() => {
    element.className = element.className.replace('show', '');
  }, 3000);
  renderAt('#toast', toastMarkup);
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001';

async function request(url, options) {
  try {
    const response = await fetch(`${SERVER}/api/${url}`, {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': SERVER,
      },
      method: 'GET',
      ...options,
    });
    if (Boolean(response.headers.get('content-type'))) {
      return await response.json();
    }
    return null;
  } catch (err) {
    renderToast('error', 'Something went wrong');
    throw err;
  }
}

async function getTracks() {
  try {
    const result = await request('tracks');
    return result;
  } catch (err) {
    console.error('Problem with getTracks request::', err);
  }
}

async function getRacers() {
  try {
    const result = await request('cars');
    return result;
  } catch (err) {
    console.error('Problem with getRacers request::', err);
  }
}

async function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  try {
    const result = await request('races', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return result;
  } catch (err) {
    console.error('Problem with createRace request::', err);
  }
}

async function getRace(id) {
  try {
    const result = await request(`races/${id}`);
    return result;
  } catch (err) {
    console.error('Problem with getRace request::', err);
  }
}

async function startRace(id) {
  try {
    const result = await request(`races/${id}/start`, {
      method: 'POST',
    });
    return result;
  } catch (err) {
    console.error('Problem with startRace request::', err);
  }
}

async function accelerate(id) {
  try {
    const result = await request(`races/${id}/accelerate`, {
      method: 'POST',
    });

    return result;
  } catch (err) {
    console.error('Problem with accelerate request::', err);
  }
}
