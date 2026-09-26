export function renderSettingsPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Epic Free Games Bot - Preferences</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f1115;
        --card: #171a21;
        --border: #262b36;
        --text: #e8eaed;
        --muted: #9aa0ab;
        --accent: #4f8cff;
        --ok: #35c07d;
        --warn: #f0a13c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        justify-content: center;
        padding: 40px 16px;
      }
      main { width: 100%; max-width: 720px; }
      h1 { font-size: 24px; margin: 0 0 4px; }
      .subtitle { color: var(--muted); margin: 0 0 24px; font-size: 14px; }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
      }
      label.field-label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 8px; }
      .price-row { display: flex; align-items: center; gap: 10px; }
      .currency { font-size: 20px; font-weight: 600; color: var(--muted); }
      input[type="number"] {
        flex: 1;
        background: #0d0f13;
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text);
        font-size: 20px;
        padding: 12px 14px;
        outline: none;
      }
      input[type="number"]:focus { border-color: var(--accent); }
      input[type="number"]:disabled { opacity: 0.45; }
      .toggle { display: flex; align-items: center; gap: 10px; margin-top: 14px; font-size: 14px; color: var(--muted); }
      .toggle input { width: 18px; height: 18px; accent-color: var(--accent); }
      .actions { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
      button.primary {
        background: var(--accent);
        border: none;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        padding: 11px 20px;
        border-radius: 10px;
        cursor: pointer;
      }
      button.primary:hover { background: #3f7bef; }
      button.ghost {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 13px;
        padding: 10px 14px;
        border-radius: 10px;
        cursor: pointer;
      }
      button.ghost:hover { color: var(--text); border-color: var(--muted); }
      .presets { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
      .status { font-size: 13px; margin-top: 14px; color: var(--muted); min-height: 18px; }
      .status.ok { color: var(--ok); }
      .status.error { color: #ff6b6b; }
      h2 { font-size: 16px; margin: 0 0 4px; }
      #games-meta { color: var(--muted); font-size: 13px; margin: 0 0 12px; }
      ul#games { list-style: none; margin: 0; padding: 0; }
      li.game {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-top: 1px solid var(--border);
      }
      li.game:first-child { border-top: none; }
      .game-title { flex: 1; font-size: 14px; }
      .game-price { font-size: 13px; color: var(--muted); }
      .badge { font-size: 11px; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
      li.match .badge { background: rgba(53, 192, 125, 0.15); color: var(--ok); }
      li.skip .badge { background: rgba(240, 161, 60, 0.15); color: var(--warn); }
    </style>
  </head>
  <body>
    <main>
      <h1>🎮 Epic Free Games Bot</h1>
      <p class="subtitle">
        Pick the price range you care about. Only free games whose normal price
        matches your limit are emailed to you.
      </p>

      <section class="card">
        <form id="settings-form">
          <label class="field-label" for="max-price">
            Email me free games whose normal price is less than
          </label>
          <div class="price-row">
            <span class="currency">₹</span>
            <input id="max-price" type="number" min="0" step="1" placeholder="500" />
          </div>
          <div class="presets">
            <button type="button" class="ghost" data-value="500">₹500</button>
            <button type="button" class="ghost" data-value="1000">₹1000</button>
            <button type="button" class="ghost" data-value="2000">₹2000</button>
          </div>
          <label class="toggle">
            <input id="no-limit" type="checkbox" />
            No limit - email me every free game
          </label>
          <div class="actions">
            <button class="primary" type="submit">Save preference</button>
          </div>
          <div id="status" class="status"></div>
        </form>
      </section>

      <section class="card">
        <h2>Current free games</h2>
        <p id="games-meta">Loading...</p>
        <ul id="games"></ul>
      </section>
    </main>
    <script>
      var form = document.getElementById("settings-form");
      var priceInput = document.getElementById("max-price");
      var noLimit = document.getElementById("no-limit");
      var status = document.getElementById("status");
      var gamesList = document.getElementById("games");
      var gamesMeta = document.getElementById("games-meta");

      function setStatus(message, kind) {
        status.textContent = message;
        status.className = "status " + (kind || "");
      }

      function applySettings(data) {
        if (data.maxPrice === null || data.maxPrice === undefined) {
          noLimit.checked = true;
          priceInput.value = "";
          priceInput.disabled = true;
        } else {
          noLimit.checked = false;
          priceInput.value = data.maxPrice;
          priceInput.disabled = false;
        }
      }

      noLimit.addEventListener("change", function () {
        priceInput.disabled = noLimit.checked;
        if (noLimit.checked) {
          priceInput.value = "";
        }
      });

      Array.prototype.forEach.call(
        document.querySelectorAll("[data-value]"),
        function (button) {
          button.addEventListener("click", function () {
            noLimit.checked = false;
            priceInput.disabled = false;
            priceInput.value = button.getAttribute("data-value");
          });
        },
      );

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var payload = { maxPrice: noLimit.checked ? null : priceInput.value };

        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { ok: res.ok, data: data };
            });
          })
          .then(function (result) {
            if (!result.ok) {
              setStatus(result.data.error || "Could not save.", "error");
              return;
            }

            applySettings(result.data);

            if (result.data.maxPrice === null) {
              setStatus("Saved - no price limit applied.", "ok");
            } else {
              setStatus(
                "Saved - only games under ₹" +
                  result.data.maxPrice +
                  " will be emailed.",
                "ok",
              );
            }

            loadGames();
          })
          .catch(function () {
            setStatus("Could not reach the server.", "error");
          });
      });

      function loadSettings() {
        return fetch("/api/settings")
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            applySettings(data);
          })
          .catch(function () {
            setStatus("Could not load your saved preference.", "error");
          });
      }

      function loadGames() {
        gamesMeta.textContent = "Loading current free games...";
        gamesList.innerHTML = "";

        fetch("/api/free-games")
          .then(function (res) {
            return res.json().then(function (data) {
              return { ok: res.ok, data: data };
            });
          })
          .then(function (result) {
            if (!result.ok) {
              gamesMeta.textContent =
                result.data.error || "Could not load games.";
              return;
            }

            var games = result.data.games || [];

            if (games.length === 0) {
              gamesMeta.textContent = "No free games right now.";
              return;
            }

            gamesMeta.textContent = "Currently free on Epic Games:";

            games.forEach(function (game) {
              var item = document.createElement("li");
              item.className = "game " + (game.matchesFilter ? "match" : "skip");

              var title = document.createElement("span");
              title.className = "game-title";
              title.textContent = game.title;

              var price = document.createElement("span");
              price.className = "game-price";
              price.textContent = game.originalPrice;

              var badge = document.createElement("span");
              badge.className = "badge";
              badge.textContent = game.matchesFilter ? "Will email" : "Filtered out";

              item.appendChild(title);
              item.appendChild(price);
              item.appendChild(badge);
              gamesList.appendChild(item);
            });
          })
          .catch(function () {
            gamesMeta.textContent = "Could not reach the server.";
          });
      }

      loadSettings().then(loadGames);

    </script>
  </body>
</html>`;
}
