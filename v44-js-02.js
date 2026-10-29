const API = 'a707340a9f22632205846e9115f0dfd5';
        const BASE = (window.location.hostname.indexOf('workers.dev') !== -1) ? (window.location.origin + '/api/tmdb') : 'https://family-night-api.alirezadoe8.workers.dev/v1/tmdb';
        const FN_AI_URL = 'https://family-night-api.alirezadoe8.workers.dev/v1/ai/chat'; // FN-CF-AI: Cloudflare AI first for every app AI box

        // ===== MULTI-PROXY FALLBACK LIST (فقط برای سرویس‌های non-TMDB) =====
        const PROXIES = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://proxy.cors.sh/',
            'https://thingproxy.freeboard.io/fetch/',
        ];
        let PROXY = PROXIES[0];
        let _proxyIdx = 0;

        // ===== SMART CACHE SYSTEM (کش هوشمند) =====
        const CACHE_PREFIX = 'fn_cache_';
        const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours fresh
        const CACHE_STALE_TTL = 24 * 60 * 60 * 1000; // 24h stale (for offline fallback)

        function _cacheGet(key) {
            try {
                const raw = localStorage.getItem(CACHE_PREFIX + key);
                if (!raw) return null;
                return JSON.parse(raw); // {data, ts}
            } catch(e) { return null; }
        }
        function _cacheSet(key, data) {
            try {
                const allKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith(CACHE_PREFIX)) allKeys.push(k);
                }
                if (allKeys.length > 150) {
                    allKeys.slice(0, 30).forEach(k => localStorage.removeItem(k));
                }
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
            } catch(e) {
                _clearOldCache();
                try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() })); } catch(e2) {}
            }
        }
        function _clearOldCache() {
            const now = Date.now();
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
            }
            keys.forEach(k => {
                try {
                    const obj = JSON.parse(localStorage.getItem(k));
                    if (obj && (now - obj.ts) > CACHE_STALE_TTL) localStorage.removeItem(k);
                } catch(e) { localStorage.removeItem(k); }
            });
        }

        // Network status tracking
        let _isOnline = navigator.onLine;
        window.addEventListener('online', () => { _isOnline = true; showNetworkStatus(true); });
        window.addEventListener('offline', () => { _isOnline = false; showNetworkStatus(false); });

        function showNetworkStatus(online) {
            const el = document.getElementById('network-indicator');
            if (!el) return;
            if (!online) {
                el.style.display = 'block';
                el.innerHTML = '📵 آفلاین - نمایش از حافظه کش / Offline - Showing cached data';
            } else {
                el.style.display = 'none';
            }
        }

        // ===== FETCH - TMDB مستقیم، بقیه با proxy fallback =====
        async function _fetchWithFallback(finalUrl) {
            const isTMDB = finalUrl.includes('api.themoviedb.org') || finalUrl.includes('family-night-api.alirezadoe8.workers.dev') || finalUrl.indexOf('/api/tmdb') !== -1;
            
            if (isTMDB) {
                // TMDB از CORS پشتیبانی می‌کنه — مستقیم و سریع
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 12000);
                    const res = await fetch(finalUrl, { signal: controller.signal });
                    clearTimeout(timeout);
                    if (res.ok) return await res.json();
                } catch(e) { /* fall through to proxy */ }
                // اگه مستقیم نشد، یه بار با اولین proxy امتحان کن
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    const proxyUrl = PROXIES[0] + encodeURIComponent(finalUrl);
                    const res = await fetch(proxyUrl, { signal: controller.signal });
                    clearTimeout(timeout);
                    if (res.ok) return await res.json();
                } catch(e) {}
                throw new Error('TMDB fetch failed');
            }
            
            // سرویس‌های غیر TMDB — همه proxy ها رو امتحان کن
            for (let attempt = 0; attempt < PROXIES.length; attempt++) {
                const idx = (_proxyIdx + attempt) % PROXIES.length;
                const proxyUrl = PROXIES[idx] + encodeURIComponent(finalUrl);
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    const res = await fetch(proxyUrl, { signal: controller.signal });
                    clearTimeout(timeout);
                    if (res.ok) {
                        _proxyIdx = idx;
                        PROXY = PROXIES[idx];
                        return await res.json();
                    }
                } catch(e) { /* try next */ }
            }
            throw new Error('All proxies failed');
        }
        
        // YouTube Data API v3 Key
        const YT_API_KEY = 'AIzaSyCpHZHxnE7dRF3duD8H1ye5hadeSW0d1yk';
        
        // --- IMAGE CONFIG - مستقیم از TMDB ---
        const TMDB_IMG_BASE = 'https://family-night-api.alirezadoe8.workers.dev/img';
        const IMG = TMDB_IMG_BASE + '/w200';
        const IMG_LG = TMDB_IMG_BASE + '/w500';
        const IMG_BG = TMDB_IMG_BASE + '/w1280';
        
        const FAV_KEY = 'family_favs_v2';
        const MIN_VOTES = 100;
        let LANG = localStorage.getItem('lang') || 'fa';
        let PRIMARY_COLOR = localStorage.getItem('primary_color') || '#E50914';
        
        // DOWNLOADS DATABASE - این دیتابیس شامل لینک‌های مستقیم دانلود 914 اثر است
        // دیتابیس از فایل خارجی بارگذاری می‌شود
        const DOWNLOADS_DB = {};
        let currentDownloadUrl = '';
        
        // CURATOR'S PICK - 483 Selected Movies (title + year, cleaned and deduplicated)
        const CURATOR_PICKS = [{"title":"The Jacket","year":2005},{"title":"Gladiator","year":2000},{"title":"Platoon","year":1986},{"title":"The Exorcist","year":1973},{"title":"Burn After Reading","year":2008},{"title":"Harry Potter and the Order of the Phoenix","year":2007},{"title":"9","year":2009},{"title":"Flyboys","year":2006},{"title":"In the Mood for Love","year":2000},{"title":"North by Northwest","year":1959},{"title":"Toy Story 4","year":2019},{"title":"The Grand Budapest Hotel","year":2014},{"title":"Children of Heaven","year":1997},{"title":"Les Misérables","year":2012},{"title":"The Silence of the Lambs","year":1991},{"title":"Sin City","year":2005},{"title":"Mother!","year":2017},{"title":"Rosemary's Baby","year":1968},{"title":"L.A. Confidential","year":1997},{"title":"About Time","year":2013},{"title":"Scream","year":1996},{"title":"The Gold Rush","year":1925},{"title":"Her","year":2013},{"title":"Moonlight","year":2016},{"title":"Million Dollar Baby","year":2004},{"title":"Cinema Paradiso","year":1988},{"title":"The Matrix","year":1999},{"title":"World War Z","year":2013},{"title":"The Big Lebowski","year":1998},{"title":"Saving Private Ryan","year":1998},{"title":"Lord of War","year":2005},{"title":"Kingdom of Heaven","year":2005},{"title":"Double Indemnity","year":1944},{"title":"The Amazing Spider-Man","year":2012},{"title":"Goodfellas","year":1990},{"title":"12 Angry Men","year":1957},{"title":"The Godfather Part II","year":1974},{"title":"East of Eden","year":1955},{"title":"The Pianist","year":2002},{"title":"Paths of Glory","year":1957},{"title":"Brothers","year":2009},{"title":"Pickpocket","year":1959},{"title":"Capernaum","year":2018},{"title":"Life and a Day","year":2016},{"title":"Spider-Man: Into the Spider-Verse","year":2018},{"title":"Amour","year":2012},{"title":"Three Colors: Red","year":1994},{"title":"Maze Runner: The Death Cure","year":2018},{"title":"The Fountain","year":2006},{"title":"Lost in Translation","year":2003},{"title":"Demolition","year":2015},{"title":"Atonement","year":2007},{"title":"Walnut Tree","year":2020},{"title":"Trainspotting","year":1996},{"title":"Sweeney Todd: The Demon Barber of Fleet Street","year":2007},{"title":"Panic Room","year":2002},{"title":"Life Is Beautiful","year":1997},{"title":"Bronson","year":2008},{"title":"El Camino: A Breaking Bad Movie","year":2019},{"title":"Chocolat","year":2000},{"title":"The Sting","year":1973},{"title":"The Grey","year":2011},{"title":"Life of Pi","year":2012},{"title":"The Platform","year":2019},{"title":"Dirty Dancing","year":1987},{"title":"The Amazing Spider-Man 2","year":2014},{"title":"Moon","year":2009},{"title":"Incendies","year":2010},{"title":"Casino","year":1995},{"title":"Spider-Man 2","year":2004},{"title":"Annie Hall","year":1977},{"title":"La Haine","year":1995},{"title":"The Martian","year":2015},{"title":"Wild Strawberries","year":1957},{"title":"City of God","year":2002},{"title":"The Imitation Game","year":2014},{"title":"The Hunt","year":2012},{"title":"Solaris","year":1972},{"title":"Frankenstein","year":1931},{"title":"Amores Perros","year":2000},{"title":"Naked","year":1993},{"title":"1917","year":2019},{"title":"Whiplash","year":2014},{"title":"Mr. Nobody","year":2009},{"title":"The Wolf of Wall Street","year":2013},{"title":"Amélie","year":2001},{"title":"Three Colors: White","year":1994},{"title":"Rope","year":1948},{"title":"Rango","year":2011},{"title":"Good Will Hunting","year":1997},{"title":"City Lights","year":1931},{"title":"Ae Dil Hai Mushkil","year":2016},{"title":"The Texas Chain Saw Massacre","year":1974},{"title":"Swiss Army Man","year":2016},{"title":"Harry Potter and the Deathly Hallows: Part 1","year":2010},{"title":"Shutter Island","year":2010},{"title":"Shame","year":2011},{"title":"House of Sand and Fog","year":2003},{"title":"Dark Water","year":2005},{"title":"The Theory of Everything","year":2014},{"title":"Get Out","year":2017},{"title":"The Notebook","year":2004},{"title":"District B13","year":2004},{"title":"No Country for Old Men","year":2007},{"title":"Past Lives","year":2023},{"title":"Suspiria","year":1977},{"title":"The Crush","year":1993},{"title":"Biutiful","year":2010},{"title":"Rain Man","year":1988},{"title":"Just 6.5","year":2019},{"title":"The Whale","year":2022},{"title":"Repulsion","year":1965},{"title":"American Psycho","year":2000},{"title":"Microhabitat","year":2017},{"title":"Mystic River","year":2003},{"title":"Citizen Kane","year":1941},{"title":"Nomadland","year":2020},{"title":"X-Men: The Last Stand","year":2006},{"title":"Modern Times","year":1936},{"title":"The Third Man","year":1949},{"title":"Chungking Express","year":1994},{"title":"Pearl","year":2022},{"title":"The Killers","year":1956},{"title":"Enemy","year":2013},{"title":"The Gentlemen","year":2019},{"title":"X2","year":2003},{"title":"Nocturnal Animals","year":2016},{"title":"Barfi!","year":2012},{"title":"Songs from the Second Floor","year":2000},{"title":"X-Men: Days of Future Past","year":2014},{"title":"The Batman","year":2022},{"title":"It's a Wonderful Life","year":1946},{"title":"Metropolis","year":1927},{"title":"The Elephant Man","year":1980},{"title":"Midnight in Paris","year":2011},{"title":"Dial M for Murder","year":1954},{"title":"Three Billboards Outside Ebbing, Missouri","year":2017},{"title":"Monsters, Inc.","year":2001},{"title":"Serpico","year":1973},{"title":"Germany Year Zero","year":1948},{"title":"12 Years a Slave","year":2013},{"title":"Arctic","year":2018},{"title":"Requiem for a Dream","year":2000},{"title":"The General","year":1926},{"title":"To Catch a Thief","year":1955},{"title":"Nostalghia","year":1983},{"title":"A Clockwork Orange","year":1971},{"title":"Blue Valentine","year":2010},{"title":"Django Unchained","year":2012},{"title":"Memento","year":2000},{"title":"Heat","year":1995},{"title":"The Return","year":2003},{"title":"Dead Poets Society","year":1989},{"title":"Escape from Alcatraz","year":1979},{"title":"The Host","year":2006},{"title":"Pan's Labyrinth","year":2006},{"title":"Fury","year":2014},{"title":"The Sixth Sense","year":1999},{"title":"Spider-Man","year":2002},{"title":"The Girl with the Dragon Tattoo","year":2011},{"title":"Spirited Away","year":2001},{"title":"Dead Man Walking","year":1995},{"title":"Up","year":2009},{"title":"Half Nelson","year":2006},{"title":"Notorious","year":1946},{"title":"Before Sunrise","year":1995},{"title":"Leila's Brothers","year":2022},{"title":"Fight Club","year":1999},{"title":"The Shining","year":1980},{"title":"Full Metal Jacket","year":1987},{"title":"Eternal Sunshine of the Spotless Mind","year":2004},{"title":"Joker","year":2019},{"title":"Sausage Party","year":2016},{"title":"The Wailing","year":2016},{"title":"The Lord of the Rings: The Return of the King","year":2003},{"title":"Coco","year":2017},{"title":"The Lord of the Rings: The Fellowship of the Ring","year":2001},{"title":"3-Iron","year":2004},{"title":"Parasite","year":2019},{"title":"Taxi Driver","year":1976},{"title":"Rise of the Planet of the Apes","year":2011},{"title":"Princess Mononoke","year":1997},{"title":"To Have and Have Not","year":1944},{"title":"Face/Off","year":1997},{"title":"The Great Dictator","year":1940},{"title":"Irréversible","year":2002},{"title":"There Will Be Blood","year":2007},{"title":"Phantom Thread","year":2017},{"title":"Casablanca","year":1942},{"title":"Candy","year":2006},{"title":"Jennifer's Body","year":2009},{"title":"Schindler's List","year":1993},{"title":"Strangers on a Train","year":1951},{"title":"I Am Sam","year":2001},{"title":"Prisoners","year":2013},{"title":"Rebel Without a Cause","year":1955},{"title":"Sherlock Jr.","year":1924},{"title":"The Banshees of Inisherin","year":2022},{"title":"X-Men: First Class","year":2011},{"title":"Holy Spider","year":2022},{"title":"Cast Away","year":2000},{"title":"Pulp Fiction","year":1994},{"title":"A Farewell to Arms","year":1932},{"title":"Three Colors: Blue","year":1993},{"title":"Sisu","year":2022},{"title":"Warrior","year":2011},{"title":"The Maze Runner","year":2014},{"title":"Children of Men","year":2006},{"title":"All Quiet on the Western Front","year":2022},{"title":"Us","year":2019},{"title":"Closer","year":2004},{"title":"Half Moon","year":2006},{"title":"The Hateful Eight","year":2015},{"title":"Hacksaw Ridge","year":2016},{"title":"Lars and the Real Girl","year":2007},{"title":"Darkest Hour","year":2017},{"title":"Split","year":2016},{"title":"Room","year":2015},{"title":"The Shape of Water","year":2017},{"title":"Brokeback Mountain","year":2005},{"title":"Possession","year":1981},{"title":"Rebecca","year":1940},{"title":"Beetlejuice","year":1988},{"title":"Se7en","year":1995},{"title":"Black Swan","year":2010},{"title":"Jojo Rabbit","year":2019},{"title":"The Place Beyond the Pines","year":2012},{"title":"Marrowbone","year":2017},{"title":"The Salesman","year":2016},{"title":"Marriage Story","year":2019},{"title":"Back to the Future Part II","year":1989},{"title":"127 Hours","year":2010},{"title":"X-Men","year":2000},{"title":"The Hobbit: The Battle of the Five Armies","year":2014},{"title":"Chinatown","year":1974},{"title":"The French Dispatch","year":2021},{"title":"Taste of Cherry","year":1997},{"title":"Reservoir Dogs","year":1992},{"title":"Pi","year":1998},{"title":"The Seventh Seal","year":1957},{"title":"Source Code","year":2011},{"title":"The Invisible Guest","year":2016},{"title":"Das Boot","year":1981},{"title":"Fargo","year":1996},{"title":"Uncut Gems","year":2019},{"title":"Back to the Future","year":1985},{"title":"Apocalypto","year":2006},{"title":"What Happened to Monday","year":2017},{"title":"21 Grams","year":2003},{"title":"The Deer","year":1974},{"title":"A Dog's Life","year":1918},{"title":"The Lion King","year":1994},{"title":"Night on Earth","year":1991},{"title":"V for Vendetta","year":2005},{"title":"The Intouchables","year":2011},{"title":"Harry Potter and the Half-Blood Prince","year":2009},{"title":"Passengers","year":2016},{"title":"Mirror","year":1975},{"title":"Singin' in the Rain","year":1952},{"title":"Oldboy","year":2003},{"title":"Inside Llewyn Davis","year":2013},{"title":"The Others","year":2001},{"title":"Changeling","year":2008},{"title":"The Wages of Fear","year":1953},{"title":"Gravity","year":2013},{"title":"Some Like It Hot","year":1959},{"title":"Triple Frontier","year":2019},{"title":"The Northman","year":2022},{"title":"Home Alone","year":1990},{"title":"Never Let Me Go","year":2010},{"title":"The Imaginarium of Doctor Parnassus","year":2009},{"title":"A Beautiful Mind","year":2001},{"title":"Blade Runner 2049","year":2017},{"title":"Come and See","year":1985},{"title":"Rear Window","year":1954},{"title":"Pirates of the Caribbean: At World's End","year":2007},{"title":"Inglourious Basterds","year":2009},{"title":"About Elly","year":2009},{"title":"Inception","year":2010},{"title":"Good Time","year":2017},{"title":"The Godfather","year":1972},{"title":"American Beauty","year":1999},{"title":"The Danish Girl","year":2015},{"title":"Maze Runner: The Scorch Trials","year":2015},{"title":"Mumbai Diaries","year":2010},{"title":"Persona","year":1966},{"title":"Last Night in Soho","year":2021},{"title":"A Most Violent Year","year":2014},{"title":"Pirates of the Caribbean: Dead Men Tell No Tales","year":2017},{"title":"Spider-Man 3","year":2007},{"title":"War Horse","year":2011},{"title":"Irma la Douce","year":1963},{"title":"Tehran Taboo","year":2017},{"title":"Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb","year":1964},{"title":"Babel","year":2006},{"title":"Mulholland Drive","year":2001},{"title":"The Devil's Advocate","year":1997},{"title":"A Separation","year":2011},{"title":"The Wizard of Oz","year":1939},{"title":"The Lighthouse","year":2019},{"title":"The Lord of the Rings: The Two Towers","year":2002},{"title":"Apocalypse Now","year":1979},{"title":"Into the Wild","year":2007},{"title":"Vivre Sa Vie","year":1962},{"title":"Sunset Boulevard","year":1950},{"title":"The Curious Case of Benjamin Button","year":2008},{"title":"M","year":1931},{"title":"Gentlemen Prefer Blondes","year":1953},{"title":"Mad Max: Fury Road","year":2015},{"title":"Thank You for Smoking","year":2005},{"title":"Sleepy Hollow","year":1999},{"title":"The Mist","year":2007},{"title":"The Covenant","year":2023},{"title":"Shaun of the Dead","year":2004},{"title":"Constantine","year":2005},{"title":"A Streetcar Named Desire","year":1951},{"title":"Léon: The Professional","year":1994},{"title":"Snatch","year":2000},{"title":"The Circus","year":1928},{"title":"Drive","year":2011},{"title":"American History X","year":1998},{"title":"The Machinist","year":2004},{"title":"The Wrestler","year":2008},{"title":"In Bruges","year":2008},{"title":"Dunkirk","year":2017},{"title":"Blue Velvet","year":1986},{"title":"Nightcrawler","year":2014},{"title":"Interview with the Vampire","year":1994},{"title":"Kramer vs. Kramer","year":1979},{"title":"Gone Girl","year":2014},{"title":"Stalker","year":1979},{"title":"The Green Mile","year":1999},{"title":"I Am Zlatan","year":2021},{"title":"X-Men: Apocalypse","year":2016},{"title":"Love in the Afternoon","year":1957},{"title":"Witness for the Prosecution","year":1957},{"title":"Birdman or (The Unexpected Virtue of Ignorance)","year":2014},{"title":"It Happened One Night","year":1934},{"title":"Wildlife","year":2018},{"title":"James Dean","year":2001},{"title":"In Time","year":2011},{"title":"Steve Jobs","year":2015},{"title":"Sabrina","year":1954},{"title":"Locke","year":2013},{"title":"Only Lovers Left Alive","year":2013},{"title":"The Color of Pomegranates","year":1969},{"title":"Kill Bill: Vol. 1","year":2003},{"title":"Grave of the Fireflies","year":1988},{"title":"The Lobster","year":2015},{"title":"Slumdog Millionaire","year":2008},{"title":"Detachment","year":2011},{"title":"Gangs of New York","year":2002},{"title":"500 Days of Summer","year":2009},{"title":"La La Land","year":2016},{"title":"The Apartment","year":1960},{"title":"The Big Sleep","year":1946},{"title":"In a Lonely Place","year":1950},{"title":"Stay","year":2005},{"title":"The Fearless Vampire Killers","year":1967},{"title":"The Shawshank Redemption","year":1994},{"title":"The Social Network","year":2010},{"title":"Cold War","year":2018},{"title":"Memories of Murder","year":2003},{"title":"Paris, Texas","year":1984},{"title":"Edward Scissorhands","year":1990},{"title":"Dallas Buyers Club","year":2013},{"title":"The Sacrifice","year":1986},{"title":"Train to Busan","year":2016},{"title":"The Florida Project","year":2017},{"title":"Ford v Ferrari","year":2019},{"title":"The Nice Guys","year":2016},{"title":"How to Marry a Millionaire","year":1953},{"title":"Where Is the Friend's House?","year":1987},{"title":"Harry Potter and the Philosopher's Stone","year":2001},{"title":"The Number 23","year":2007},{"title":"Forrest Gump","year":1994},{"title":"I Saw the Devil","year":2010},{"title":"Pirates of the Caribbean: Dead Man's Chest","year":2006},{"title":"Vertigo","year":1958},{"title":"The Lives of Others","year":2006},{"title":"Back to the Future Part III","year":1990},{"title":"Big Eyes","year":2014},{"title":"Scarface","year":1983},{"title":"Braveheart","year":1995},{"title":"The Revenant","year":2015},{"title":"Signs","year":2002},{"title":"District 9","year":2009},{"title":"Mary and Max","year":2009},{"title":"Another Round","year":2020},{"title":"Bitter Moon","year":1992},{"title":"The Departed","year":2006},{"title":"Heathers","year":1989},{"title":"The Truman Show","year":1998},{"title":"Scent of a Woman","year":1992},{"title":"The Prestige","year":2006},{"title":"8 Mile","year":2002},{"title":"Begin Again","year":2013},{"title":"Fast Times at Ridgemont High","year":1982},{"title":"Ivan's Childhood","year":1962},{"title":"Bicycle Thieves","year":1948},{"title":"Gloomy Sunday","year":1999},{"title":"Training Day","year":2001},{"title":"Green Book","year":2018},{"title":"Série noire","year":1979},{"title":"Andrei Rublev","year":1966},{"title":"The Bridges of Madison County","year":1995},{"title":"The Boy in the Striped Pajamas","year":2008},{"title":"Eyes Wide Shut","year":1999},{"title":"The Godfather Part III","year":1990},{"title":"Pirates of the Caribbean: The Curse of the Black Pearl","year":2003},{"title":"The Thing","year":1982},{"title":"Rashomon","year":1950},{"title":"Perfect Blue","year":1997},{"title":"Buried","year":2010},{"title":"Pirates of the Caribbean: On Stranger Tides","year":2011},{"title":"Harry Potter and the Prisoner of Azkaban","year":2004},{"title":"Dog Day Afternoon","year":1975},{"title":"WALL·E","year":2008},{"title":"Son of Saul","year":2015},{"title":"Carrie","year":1976},{"title":"How to Lose a Guy in 10 Days","year":2003},{"title":"Harry Potter and the Deathly Hallows: Part 2","year":2011},{"title":"Arrival","year":2016},{"title":"The Hobbit: An Unexpected Journey","year":2012},{"title":"The Grapes of Wrath","year":1940},{"title":"The Kid","year":1921},{"title":"2046","year":2004},{"title":"Vicky Cristina Barcelona","year":2008},{"title":"Harry Potter and the Goblet of Fire","year":2005},{"title":"Argo","year":2012},{"title":"Frozen","year":2010},{"title":"Shoplifters","year":2018},{"title":"Ida","year":2013},{"title":"Southpaw","year":2015},{"title":"A Girl Walks Home Alone at Night","year":2014},{"title":"The Graduate","year":1967},{"title":"Out of the Furnace","year":2013},{"title":"Johnny Guitar","year":1954},{"title":"The Disaster Artist","year":2017},{"title":"Wings of Desire","year":1987},{"title":"Big Fish","year":2003},{"title":"The Banishment","year":2007},{"title":"Manchester by the Sea","year":2016},{"title":"The Ballad of Buster Scruggs","year":2018},{"title":"The Maltese Falcon","year":1941},{"title":"The Hobbit: The Desolation of Smaug","year":2013},{"title":"One Flew Over the Cuckoo's Nest","year":1975},{"title":"The Dark Knight","year":2008},{"title":"Psycho","year":1960},{"title":"Kill Bill: Vol. 2","year":2004},{"title":"Hunger","year":2008},{"title":"Harry Potter and the Chamber of Secrets","year":2002},{"title":"World War III","year":2022},{"title":"Bohemian Rhapsody","year":2018},{"title":"Snowpiercer","year":2013},{"title":"The Pursuit of Happyness","year":2006},{"title":"Joyeux Noël","year":2005},{"title":"Downfall","year":2004},{"title":"Ikiru","year":1952},{"title":"Papillon","year":1973},{"title":"Titanic","year":1997},{"title":"Animals","year":2014},{"title":"Mr. Smith Goes to Washington","year":1939},{"title":"U Are the Universe","year":2024},{"title":"Jay Kelly","year":2025},{"title":"No Other Choice","year":2025},{"title":"A Big Bold Beautiful Journey","year":2025},{"title":"Frankenstein","year":2025},{"title":"F1","year":2025},{"title":"Ballad of a Small Player","year":2025},{"title":"One Battle After Another","year":2025},{"title":"The Smashing Machine","year":2025},{"title":"Bring Her Back","year":2025},{"title":"Mickey 17","year":2025},{"title":"The Gorge","year":2025},{"title":"Predator: Badlands","year":2025},{"title":"The Ugly Stepsister","year":2025},{"title":"Weapons","year":2025},{"title":"Caught Stealing","year":2025},{"title":"The Long Walk","year":2025},{"title":"Together","year":2025},{"title":"Companion","year":2025},{"title":"Havoc","year":2025}];
        // Backward-compatible display/search titles. Keep year attached to avoid wrong same-name movies.
        const CURATOR_PICKS_TITLES = CURATOR_PICKS.map(m => `${m.title} (${m.year})`);

        function normalizeCuratorPick(entry) {
            if (typeof entry === 'object' && entry) return { title: entry.title, year: entry.year };
            const raw = String(entry || '').trim();
            const m = raw.match(/^(.*?)\s*\((\d{4})\)\s*$/);
            return m ? { title: m[1].trim(), year: parseInt(m[2], 10) } : { title: raw, year: null };
        }

        const CURATOR_MOVIE_CACHE = {};
        const CURATOR_BAD_CACHE = new Set();

        function normalizeCuratorTitleForMatch(s) {
            return String(s || '')
                .toLowerCase()
                .replace(/&/g, 'and')
                .replace(/\b(the|a|an)\b/g, ' ')
                .replace(/[^a-z0-9]+/g, ' ')
                .trim()
                .replace(/\s+/g, ' ');
        }

        function isValidCuratorResolvedMovie(movie, item) {
            if (!movie || !movie.id || !movie.poster_path) return false;
            if (!movie.vote_average || movie.vote_average <= 0) return false; // no NR in Curator or Pick a Movie
            if (!movie.vote_count || movie.vote_count < 5) return false;
            if (movie.adult) return false;
            if (item && item.year) {
                const y = String((movie.release_date || '').slice(0, 4));
                if (y !== String(item.year)) return false;
            }
            return true;
        }

        function scoreCuratorCandidate(movie, item) {
            const target = normalizeCuratorTitleForMatch(item.title);
            const title = normalizeCuratorTitleForMatch(movie.title || movie.name);
            const original = normalizeCuratorTitleForMatch(movie.original_title || movie.original_name);
            let score = 0;
            if (title === target || original === target) score += 1000;
            if (title.startsWith(target) || original.startsWith(target)) score += 180;
            if (title.includes(target) || original.includes(target)) score += 120;
            if (target.includes(title) || target.includes(original)) score += 80;
            if (item.year && String((movie.release_date || '').slice(0,4)) === String(item.year)) score += 500;
            score += Math.min(120, Math.log10((movie.vote_count || 0) + 1) * 35);
            score += Math.min(80, (movie.popularity || 0) / 8);
            score += Math.min(50, (movie.vote_average || 0) * 5);
            return score;
        }

        const CURATOR_EXACT_MOVIE_IDS = {
            'enemy|2013': 68718,
            'the covenant|2023': 882569
        };
        async function findCuratorMovie(entry) {
            const item = normalizeCuratorPick(entry);
            if (!item.title) return null;
            const cacheKey = `${item.title}|${item.year || ''}`.toLowerCase();
            if (CURATOR_MOVIE_CACHE[cacheKey]) return CURATOR_MOVIE_CACHE[cacheKey];
            if (CURATOR_BAD_CACHE.has(cacheKey)) return null;
            const exactId = CURATOR_EXACT_MOVIE_IDS[cacheKey];
            if (exactId) {
                try {
                    const exact = await getData(`movie/${exactId}`);
                    if (isValidCuratorResolvedMovie(exact, item)) {
                        CURATOR_MOVIE_CACHE[cacheKey] = exact;
                        return exact;
                    }
                } catch(e) {}
            }

            const queries = [];
            if (item.year) queries.push(`search/movie?query=${encodeURIComponent(item.title)}&primary_release_year=${item.year}`);
            queries.push(`search/movie?query=${encodeURIComponent(item.title)}`);

            let all = [];
            for (const q of queries) {
                try {
                    const data = await getData(q);
                    if (data && Array.isArray(data.results)) all = all.concat(data.results);
                } catch(e) {}
            }

            const seen = new Set();
            const unique = all.filter(m => {
                if (!m || seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
            });

            const valid = unique
                .filter(m => isValidCuratorResolvedMovie(m, item))
                .map(m => ({ item: m, score: scoreCuratorCandidate(m, item) }))
                .filter(x => x.score >= (item.year ? 520 : 150))
                .sort((a,b) => b.score - a.score);

            if (!valid.length) {
                CURATOR_BAD_CACHE.add(cacheKey);
                return null;
            }

            CURATOR_MOVIE_CACHE[cacheKey] = valid[0].item;
            return valid[0].item;
        }
        const CURATOR_TV_CACHE = {};
        const CURATOR_TV_BAD_CACHE = new Set();
        function isValidCuratorResolvedTV(show, item) {
            if (!show || !show.id || !show.poster_path) return false;
            if (!show.vote_average || show.vote_average <= 0) return false;
            if (!show.vote_count || show.vote_count < 5) return false;
            if (item && item.year) {
                const y = String((show.first_air_date || '').slice(0, 4));
                if (y !== String(item.year)) return false;
            }
            return true;
        }
        function scoreCuratorTVCandidate(show, item) {
            const target = normalizeCuratorTitleForMatch(item.title);
            const title = normalizeCuratorTitleForMatch(show.name);
            const original = normalizeCuratorTitleForMatch(show.original_name);
            let score = 0;
            if (title === target || original === target) score += 1000;
            if (title.startsWith(target) || original.startsWith(target)) score += 180;
            if (title.includes(target) || original.includes(target)) score += 120;
            if (target.includes(title) || target.includes(original)) score += 80;
            if (item.year && String((show.first_air_date || '').slice(0,4)) === String(item.year)) score += 500;
            score += Math.min(120, Math.log10((show.vote_count || 0) + 1) * 35);
            score += Math.min(80, (show.popularity || 0) / 8);
            score += Math.min(50, (show.vote_average || 0) * 5);
            return score;
        }
        async function findCuratorTVShow(entry) {
            const item = normalizeCuratorPick(entry);
            if (!item.title) return null;
            const cacheKey = `${item.title}|${item.year || ''}`.toLowerCase();
            if (CURATOR_TV_CACHE[cacheKey]) return CURATOR_TV_CACHE[cacheKey];
            if (CURATOR_TV_BAD_CACHE.has(cacheKey)) return null;

            const queries = [];
            if (item.year) queries.push(`search/tv?query=${encodeURIComponent(item.title)}&first_air_date_year=${item.year}`);
            queries.push(`search/tv?query=${encodeURIComponent(item.title)}`);

            let all = [];
            for (const q of queries) {
                try {
                    const data = await getData(q);
                    if (data && Array.isArray(data.results)) all = all.concat(data.results);
                } catch(e) {}
            }
            const seen = new Set();
            const unique = all.filter(m => {
                if (!m || seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
            });
            const valid = unique
                .filter(m => isValidCuratorResolvedTV(m, item))
                .map(m => ({ item: m, score: scoreCuratorTVCandidate(m, item) }))
                .filter(x => x.score >= (item.year ? 520 : 150))
                .sort((a,b) => b.score - a.score);

            if (!valid.length) {
                CURATOR_TV_BAD_CACHE.add(cacheKey);
                return null;
            }
            CURATOR_TV_CACHE[cacheKey] = valid[0].item;
            return valid[0].item;
        }
        async function loadCuratorPicks(elId) {
            const c = document.getElementById(elId);
            if(!c) return;
            const shuffled = [...CURATOR_PICKS].sort(() => 0.5 - Math.random());
            let added = 0;
            for (let i = 0; i < shuffled.length && added < 20; i++) {
                try {
                    const movie = await findCuratorMovie(shuffled[i]);
                    if (movie && isValidCuratorResolvedMovie(movie, normalizeCuratorPick(shuffled[i]))) {
                        c.innerHTML += makeCard(movie, 'movie');
                        added++;
                    }
                } catch(e) { console.error('Error loading curator pick:', e); }
            }
            if (!added) {
                c.innerHTML = `<div style="padding:15px;color:#888;font-size:12px;">${LANG==='fa'?'فعلاً پیشنهاد معتبری پیدا نشد.':'No valid curator pick found right now.'}</div>`;
            }
        }
        // تابع Refresh برای Curator
        function refreshCurator() {
            const container = document.getElementById('row-curator');
            if(container) {
                container.innerHTML = '';
                loadCuratorPicks('row-curator');
            }
        }
        
        // DICTIONARY
        const TEXTS = {
            fa: {
                home: 'خانه', mov: 'فیلم‌ها', ser: 'سریال‌ها', search: 'جستجو', set: 'تنظیمات', fav: 'لیست من',
                R_topM: 'برترین فیلم‌های تاریخ', R_topS: 'برترین سریال‌های تاریخ',
                newM25: 'فیلم‌های جدید (اکران شده)', newS25: 'سریال‌های جدید (در حال پخش)',
                updates: 'سریال‌های جدید و به‌روز شده ۲۰۲۵–۲۰۲۶',
                R_surv: 'بقا برای زنده ماندن', R_reality: 'ریالیتی شو (واقعی)',
                R_20s: 'برترین دهه‌ی ۲۰ میلادی', R_30s: 'برترین دهه‌ی ۳۰ میلادی', R_40s: 'برترین دهه‌ی ۴۰ میلادی', R_50s: 'برترین دهه‌ی ۵۰ میلادی', R_60s: 'برترین دهه‌ی ۶۰ میلادی', R_70s: 'برترین دهه‌ی ۷۰ میلادی', R_80s: 'برترین دهه‌ی ۸۰ میلادی', R_90s: 'برترین دهه‌ی ۹۰ میلادی', R_00s: 'بهترین‌های دهه ۲۰۰۰', R_10s: 'بهترین‌های دهه ۲۰۱۰',
                R_act: 'اکشن', R_com: 'کمدی', R_hor: 'ترسناک', R_dra: 'درام', R_fam: 'خانوادگی', R_sci: 'علمی تخیلی', R_fan: 'فانتزی', R_rom: 'عاشقانه', R_ani: 'انیمیشن', R_anime: 'انیمه', R_music: 'موزیکال', R_doc: 'مستند', R_war: 'جنگی', R_bio: 'بیوگرافی', R_book: 'اقتباس‌شده از کتاب و رمان', R_oscar: 'برندگان اسکار', R_emmy: 'برندگان Emmy', R_golden: 'برندگان Golden Globe', R_academy: 'برندگان Academy Awards', R_erotic: 'درام اروتیک', R_adult: '🔞 آثار بزرگسال (+۱۸)', R_marvel: 'دنیای مارول', R_a24: 'آثار A24', R_marvelTV: 'سریال‌های مارول', R_dc: 'دنیای دی‌سی', R_curator: 'پیشنهاد سازنده',
                R_iran: 'فیلم‌های ایرانی', R_iran_pre1978: 'آثار ایران قدیم (پیش از ۱۹۷۸)', R_india: 'فیلم‌های هندی', R_asia: 'فیلم‌های شرق آسیا', R_romcom: 'رام-کام', R_parody: 'پارودی',
                R_sports: 'ورزشی', R_mental: 'بیماری‌های روانی', R_docs: 'مستند', R_heartbreak: 'عشق‌های شکسته و فقدان', R_christmas: 'زمان کریسمس', R_apocalypse: 'آخرالزمان',
                seeAll: 'مشاهده همه', more: 'نمایش بیشتر',
                cast: 'بازیگران و عوامل', director: 'کارگردان‌های مطرح',
                play: 'پخش آنلاین', dl: 'لینک‌های دانلود (جستجو)', ep: 'انتخاب فصل و قسمت',
                searchPh: 'جستجوی نام فیلم، بازیگر، کارگردان...', noDesc: 'توضیحات فارسی موجود نیست.',
                noRes: 'نتیجه‌ای برای جستجوی شما یافت نشد.',
                maleTrend: 'ستارگان سینما (مرد)', femaleTrend: 'ستارگان سینما (زن)', directorTrend: 'کارگردان‌های مطرح', 
                sort: { pop: 'محبوب‌ترین', rate: 'بالاترین نمره', new: 'جدیدترین‌ها', rev: 'پرفروش‌ترین', old: 'قدیمی‌ترین', vote: 'بیشترین رای' },
                filter: { all: 'همه کشورها (مخلوط)' },
                pw_cast: 'فیلم‌ها و سریال‌های بازیگری', pw_director: 'فیلم‌ها و سریال‌های کارگردانی',
                st_theme: 'ظاهر و زبان', st_about: 'درباره ما', st_con: 'ارتباط با سازنده',
                desc_t: 'فمیلی نایت نسخه ۵.۲.۱',
                desc_b: 'تجربه نهایی تماشای فیلم و سریال با بالاترین کیفیت.',
                copy: 'تمامی حقوق برای Game of family محفوظ است.',
                dev: 'توسعه‌دهنده: علیرضا احمدی',
                randomBtn: 'نمیدونی فیلم چی ببینی؟',
                randomSub: 'بذار «Family Night» بهت پیشنهاد بده',
                moodTitle: '🎭 امشب حالت چیه؟',
                moodCom: 'کمدی', moodHor: 'ترسناک', moodDra: 'درام', moodAct: 'اکشن', moodRom: 'عاشقانه', moodDoc: 'مستند',
                moodResults: '✨ پیشنهادهای ما',
                myStats: '📊 آمار سینمایی من',
                statWatchlist: 'لیست علاقه‌مندی', statHistory: 'تماشاشده', statHours: 'ساعت تماشا (تقریبی)', statRating: 'امتیاز داده‌ام',
                qotdLabel: '🎬 دیالوگ روز',
                timecapsuleLabel: '📅 این ماه در تاریخ سینما',
                keywords: 'موضوعات (Keywords)',
                keywordsBrowse: 'مرور بر اساس موضوع',
                watchTrailer: 'مشاهده تریلر (پیش‌نمایش)',
                screenshots: 'اسکرین‌شات‌ها',
                history: 'تاریخچه تماشا',
                clearHistory: 'پاک کردن تاریخچه',
                emptyHistory: 'هنوز چیزی تماشا نکرده‌اید!',
                movie: 'فیلم',
                tvShow: 'سریال',
                miniSeries: 'مینی سریال‌ها',
                productionCountries: 'کشور سازنده',
                categories: 'دسته‌بندی‌ها',
                countries: 'کشورها',
                subjects: 'موضوعات',
                genres: 'ژانرها',
                top250Movies: '۲۵۰ فیلم برتر تاریخ',
                top250Series: '۲۵۰ سریال برتر تاریخ',
                searchAll: 'همه',
                searchMovies: '🎬 فیلم‌ها',
                searchSeries: '📺 سریال‌ها',
                searchPeople: '👤 افراد',
                downloadTitle: 'انتخاب روش دانلود',
                downloadSubtitle: 'یک گزینه را انتخاب کنید',
                dlDirect: 'دانلود مستقیم',
                dlDirectDesc: 'دانلود با مرورگر پیش‌فرض',
                dlADM: 'دانلود با ADM',
                dlADMDesc: 'استفاده از Advanced Download Manager',
                dlOther: 'دانلود با سایر برنامه‌ها',
                dlOtherDesc: 'انتخاب از دانلودرهای نصب شده',
                close: 'بستن',
                similar: 'آثار مشابه',
                compare: '⚖️ مقایسه دو اثر',
                share: '🔗 اشتراک‌گذاری',
                myRating: '⭐ امتیاز من',
                sbKeywords: 'موضوعات (Keywords)',
                searchResults: 'نتایج جستجو',
                filterSort: 'مرتب‌سازی',
                filterGenres: 'ژانرها',
                filterYears: 'سال ساخت',
                filterCountries: 'کشورها',
                filterLetters: 'حروف و اعداد',
                companiesTrend: 'استودیوها و شبکه‌ها',
                companiesAll: 'همه استودیوها و شبکه‌ها',
                companyMovies: '🎬 فیلم‌ها',
                companySeries: '📺 سریال‌ها',
                bioTitle: 'مشخصات و آشنایی با',
                galleryTitle: 'گالری عکس‌ها',
                noBio: 'بیوگرافی موجود نیست.',
                companyTypes: {
                    Streaming: 'استریمینگ', Studio: 'استودیو', 'Cable TV': 'کابل تی‌وی',
                    Animation: 'انیمیشن', Network: 'شبکه', Production: 'تولید', Distribution: 'توزیع'
                }
            },
            en: {
                home: 'Home', mov: 'Movies', ser: 'TV Series', search: 'Search', set: 'Settings', fav: 'My List',
                R_topM: 'Top Rated Movies', R_topS: 'Top Rated TV',
                newM25: 'New Movies (Now Playing)', newS25: 'New TV Series (On Air)',
                updates: 'New & Updated Series (2025–2026)',
                R_surv: 'Survival & Staying Alive', R_reality: 'Reality Shows',
                R_20s: 'Best of the 1920s', R_30s: 'Best of the 1930s', R_40s: 'Best of the 1940s', R_50s: 'Best of the 1950s', R_60s: 'Best of the 1960s', R_70s: 'Best of the 1970s', R_80s: 'Best of the 1980s', R_90s: 'Best of the 1990s', R_00s: 'Best of the 2000s', R_10s: 'Best of the 2010s',
                R_act: 'Action', R_com: 'Comedy', R_hor: 'Horror', R_dra: 'Drama', R_fam: 'Family', R_sci: 'Sci-Fi', R_fan: 'Fantasy', R_rom: 'Romance', R_ani: 'Animation', R_anime: 'Anime', R_music: 'Musical', R_doc: 'Documentary', R_war: 'War', R_bio: 'Biography', R_book: 'Based on Books & Novels', R_romcom: 'Rom-com', R_oscar: 'Oscar Winners', R_emmy: 'Emmy Winners', R_golden: 'Golden Globe Winners', R_academy: 'Academy Award Winners', R_erotic: 'Erotic Drama', R_adult: '🔞 Adults Only (18+)', R_marvel: 'Marvel Universe', R_a24: 'A24 Works', R_marvelTV: 'Marvel TV Series', R_dc: 'DC Universe', R_curator: "Curator's Pick",
                R_sports: 'Sports', R_mental: 'Mental Health', R_docs: 'Documentaries', R_heartbreak: 'Heartbreak & Loss', R_christmas: 'Christmas Time', R_apocalypse: 'Apocalypse',
                R_iran: 'Iranian Films', R_iran_pre1978: 'Classic Iranian Works (Before 1978)', R_india: 'Indian Films', R_asia: 'East Asian Films', R_parody: 'Parody',
                seeAll: 'See All', more: 'Load More',
                cast: 'Cast & Crew', director: 'Major Directors',
                play: 'Watch Online', dl: 'Download Box', ep: 'Select Season/Episode',
                searchPh: 'Search movie, actor, director...', noDesc: 'No description available.',
                noRes: 'No results found for your search.',
                maleTrend: 'Cinema Legends (Male)', femaleTrend: 'Cinema Legends (Female)', directorTrend: 'Major Directors', 
                sort: { pop: 'Most Popular', rate: 'Top Rated', new: 'Newest', rev: 'Highest Revenue', old: 'Oldest', vote: 'Most Voted' },
                filter: { all: 'All Countries (Mixed)' },
                pw_cast: 'Movies & Series as Actor', pw_director: 'Movies & Series as Director',
                st_theme: 'Appearance & Language', st_about: 'About', st_con: 'Contact Developer',
                desc_t: 'Family Night v9.7.3',
                desc_b: 'The ultimate streaming experience. High-quality movies and series at your fingertips.',
                copy: '© 2025 Game of family. All rights reserved.',
                dev: 'Developer: Alireza Ahmadi',
                randomBtn: 'Don’t know what movie to watch?',
                randomSub: 'Let Family Night suggest one.',
                moodTitle: '🎭 What\'s your mood tonight?',
                moodCom: 'Comedy', moodHor: 'Horror', moodDra: 'Drama', moodAct: 'Action', moodRom: 'Romance', moodDoc: 'Documentary',
                moodResults: '✨ Our Picks',
                myStats: '📊 My Cinema Stats',
                statWatchlist: 'Watchlist', statHistory: 'Watched', statHours: 'Hours Watched (Approx)', statRating: 'Rated',
                qotdLabel: '🎬 Quote of the Day',
                timecapsuleLabel: '📅 This Month in Cinema History',
                keywords: 'Keywords',
                keywordsBrowse: 'Browse by Keyword',
                watchTrailer: 'Watch Trailer',
                screenshots: 'Screen Shots',
                history: 'Watch History',
                clearHistory: 'Clear History',
                emptyHistory: 'No watch history yet!',
                movie: 'Movie',
                tvShow: 'TV Show',
                miniSeries: 'Mini Series',
                productionCountries: 'Production Countries',
                categories: 'Categories',
                countries: 'Countries',
                subjects: 'Subjects',
                genres: 'Genres',
                top250Movies: 'Top 250 Movies',
                top250Series: 'Top 250 Series',
                searchAll: 'All',
                searchMovies: '🎬 Movies',
                searchSeries: '📺 Series',
                searchPeople: '👤 People',
                downloadTitle: 'Choose Download Method',
                downloadSubtitle: 'Select an option',
                dlDirect: 'Direct Download',
                dlDirectDesc: 'Download with default browser',
                dlADM: 'Download with ADM',
                dlADMDesc: 'Use Advanced Download Manager',
                dlOther: 'Download with Other Apps',
                dlOtherDesc: 'Choose from installed downloaders',
                close: 'Close',
                similar: 'Similar Titles',
                compare: '⚖️ Compare Two Titles',
                share: '🔗 Share',
                myRating: '⭐ My Rating',
                sbKeywords: 'Keywords',
                searchResults: 'Search Results',
                filterSort: 'Sort By',
                filterGenres: 'Genres',
                filterYears: 'Years',
                filterCountries: 'Countries',
                filterLetters: 'Letters & Numbers',
                companiesTrend: 'Studios & Networks',
                companiesAll: 'All Studios & Networks',
                companyMovies: '🎬 Movies',
                companySeries: '📺 Series',
                bioTitle: 'About',
                galleryTitle: 'Photo Gallery',
                noBio: 'No biography available.',
                companyTypes: {
                    Streaming: 'Streaming', Studio: 'Studio', 'Cable TV': 'Cable TV',
                    Animation: 'Animation', Network: 'Network', Production: 'Production', Distribution: 'Distribution'
                }
            }
        };
        // STATE
        let curId, curType, curTitle, curImdb, curSeason=1, curEp=1, curTrailerKey = null, curTrailerKeys = [];
        let curDataForFav = {};
        // Share-only snapshot: kept separate so the rest of the details UI remains untouched.
        let curShareCredits = null; 
        let discPage = 1, discQuery = '', discType = ''; 
        let genericPage = 1, genericQuery = '', genericType = '', genericContentType = 'media';
        let genericSortMode = 'default';
        let genericViewMode = 'grid';
        let genericPersonSearchQuery = '';
        let genericPersonSearchTimer = null; 
        let favorites = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
        let WATCH_HISTORY = JSON.parse(localStorage.getItem('watch_history')) || [];
        let DL_CACHE = JSON.parse(localStorage.getItem('dl_cache') || '{}'); // {tmdbId: true/false}
        
        // Carousel State
        let carouselData = [];
        let curSlideIdx = 0;
        let slideInterval;
        // ===== LAZY IMAGE LOADING با IntersectionObserver =====
        const _imgObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        obs.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '200px 0px' }) : null;

        // Override src setter for lazy images
        function lazyImg(src, cls, alt, style) {
            if (_imgObserver) {
                return `<img data-src="${src}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" class="${cls||''}" alt="${alt||''}" style="${style||''}" loading="lazy" onload="if(this.dataset&&!this.dataset.src)this.style.opacity=1" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\'/%3E'">`;
            }
            return `<img src="${src}" class="${cls||''}" alt="${alt||''}" style="${style||''}" loading="lazy">`;
        }

        // Re-observe all lazy images in DOM (called after dynamic content added)
        function observeLazyImages() {
            if (!_imgObserver) return;
            document.querySelectorAll('img[data-src]').forEach(img => _imgObserver.observe(img));
        }

        // MutationObserver to auto-observe new images
        if (_imgObserver) {
            const _mutObs = new MutationObserver(() => {
                document.querySelectorAll('img[data-src]').forEach(img => {
                    if (!img._observed) { img._observed = true; _imgObserver.observe(img); }
                });
            });
            _mutObs.observe(document.body, { childList: true, subtree: true });
        }

        window.onload = init;
        async function getData(url) {
            const sep = url.includes('?') ? '&' : '?';
            const langParam = LANG === 'fa' ? 'fa-IR' : 'en-US';
            const apiParam = (BASE.indexOf('/api/tmdb') !== -1) ? ('api_key=' + encodeURIComponent(API) + '&') : ''; const finalUrl = `${BASE}/${url}${sep}${apiParam}language=${langParam}`;
            const cacheKey = url + '_' + langParam;

            // 1) Check fresh cache
            const cached = _cacheGet(cacheKey);
            if (cached) {
                const age = Date.now() - cached.ts;
                if (age < CACHE_TTL) return cached.data; // fresh hit
                // stale but usable as fallback if offline
                if (!_isOnline) return cached.data; // offline fallback
            }

            // 2) Try network
            try {
                const data = await _fetchWithFallback(finalUrl);
                // In FA mode: merge EN titles so cards always show English for non-Persian/Arabic titles
                if (false && LANG === 'fa' && data && data.results && data.results.length > 0) { // FN-FAST: lists use the cached FA response only; EN merge doubled every TMDB call
                    try {
                        const enUrl = `${BASE}/${url}${sep}language=en-US`;
                        const enData = await _fetchWithFallback(enUrl);
                        if (enData && enData.results) {
                            const enMap = {};
                            enData.results.forEach(item => { if (item.id) enMap[item.id] = item; });
                            data.results = data.results.map(item => {
                                const enItem = enMap[item.id];
                                if (enItem) item._en_title = enItem.title || enItem.name || '';
                                return item;
                            });
                        }
                    } catch(e) { /* silently ignore EN fetch failure */ }
                }
                _cacheSet(cacheKey, data);
                return data;
            } catch(e) {
                // 3) Network failed - return stale cache if available
                if (cached && cached.data) return cached.data;
                return { results: [] };
            }
        }

        // ===== PERFORMANCE: Request deduplication =====
        const _pendingRequests = {};
        const _origGetData = getData;
        getData = async function(url) {
            if (_pendingRequests[url]) return _pendingRequests[url];
            const p = _origGetData(url);
            _pendingRequests[url] = p;
            p.finally(() => delete _pendingRequests[url]);
            return p;
        };
        // تابع مخصوص برای دریافت ویدیو/تریلر - همیشه انگلیسی
        async function getDataEN(url) {
            const sep = url.includes('?') ? '&' : '?';
            const apiParam = (BASE.indexOf('/api/tmdb') !== -1) ? ('api_key=' + encodeURIComponent(API) + '&') : ''; const finalUrl = `${BASE}/${url}${sep}${apiParam}language=en-US`;
            const cacheKey = url + '_en-US';

            const cached = _cacheGet(cacheKey);
            if (cached) {
                const age = Date.now() - cached.ts;
                if (age < CACHE_TTL) return cached.data;
                if (!_isOnline) return cached.data;
            }

            try {
                const data = await _fetchWithFallback(finalUrl);
                _cacheSet(cacheKey, data);
                return data;
            } catch(e) {
                if (cached && cached.data) return cached.data;
                return { results: [] };
            }
        }
        function init() {
            // Check initial network state
            if (!navigator.onLine) showNetworkStatus(false);
            setTheme(PRIMARY_COLOR);
            initThemeStyles();
            // applyLang used to render Home itself. During boot, update labels only,
            // then create Home once below.
            window.__fnBooting = true;
            applyLang();
            window.__fnBooting = false;
            renderHome();
            populateFilters();
            populateSidebar();
            // Check download badges lazily after a delay
            setTimeout(checkLazyDlBadges, 3000);
            // Movie and series grids load only when their tab is opened.
            // Background preloading made an unseen screen compete with Home on mobile.
            restoreLastTab();
            restoreReopenDetail();
        }
        function restoreLastTab() {
            var saved = null;
            try { saved = sessionStorage.getItem('last_active_tab'); } catch(e) {}
            if (!saved || saved === 'home' || !document.getElementById(saved + '-tab')) return;
            var navEl = null;
            document.querySelectorAll('.nav-item').forEach(function(n) {
                var oc = n.getAttribute('onclick') || '';
                if (oc.indexOf("switchTab('" + saved + "'") > -1) navEl = n;
            });
            switchTab(saved, navEl);
            if (saved === 'search' && typeof loadTrendingActors === 'function') loadTrendingActors();
            else if (saved === 'tests' && typeof renderTestsQuizHome === 'function') renderTestsQuizHome();
            else if (saved === 'fav' && typeof loadFavorites === 'function') loadFavorites();
            else if (saved === 'history' && typeof loadHistory === 'function') loadHistory();
        }
        // بعد از تغییر زبان (که کل صفحه reload می‌شود)، اگر قبلاً مودال جزئیات یک اثر باز بوده،
        // همان اثر را با داده واقعی TMDB دوباره باز می‌کنیم تا عنوان/کادر AI هرگز خالی یا "this title" نشود.
        function restoreReopenDetail() {
            var saved = null;
            try { saved = sessionStorage.getItem('fn_reopen_detail'); } catch(e) {}
            if (!saved) return;
            try { sessionStorage.removeItem('fn_reopen_detail'); } catch(e) {}
            try {
                var info = JSON.parse(saved);
                if (info && info.id && info.type && typeof openDetail === 'function') {
                    openDetail(info.id, info.type);
                }
            } catch(e) {}
        }
        function applyUiLanguageExtras() {
            const fa = LANG === 'fa';
            const labels = {
                'up-title-text': fa ? 'پروفایل' : 'Profile',
                'up-avatar-panel-title': fa ? 'انتخاب تصویر پروفایل' : 'Choose Avatar',
                'up-gallery-label': fa ? 'انتخاب از گالری' : 'Gallery',
                'up-presets-label': fa ? 'آواتارهای آماده' : 'Presets',
                'up-name-label': fa ? 'نام' : 'Name',
                'up-choose-text': fa ? 'جنسیت' : 'Gender',
                'gender-male-label': fa ? 'مرد' : 'Male',
                'gender-female-label': fa ? 'زن' : 'Female',
                'up-age-label': fa ? 'سن' : 'Age',
                'up-age-hint': fa ? 'سن را وارد کن یا نوار را حرکت بده' : 'Type or slide',
                'up-save-btn': fa ? 'ذخیره' : 'Save',
                'sb-profile-sub-text': fa ? 'تنظیم پروفایل' : 'Set Profile',
                'pb-translate-btn-text': fa ? 'ترجمه به فارسی' : 'Translate to Persian',
                'pn-translate-all-btn': fa ? 'ترجمه کارت‌ها' : 'Translate Cards',
                'pa-translate-label': fa ? 'ترجمه به فارسی' : 'Translate to Persian',
                'bc-title-text': fa ? '📡 پخش روی نمایشگر' : '📡 Cast to Screen',
                'bc-sub-text': fa ? 'یک روش پخش انتخاب کن' : 'Choose a casting method',
                'bc-wifi-note': fa ? 'برای پخش Wi-Fi، مطمئن شو هر دو دستگاه به یک شبکه وصل هستند' : 'For Wi-Fi casting, make sure both devices are on the same network',
                'bc-close-text': fa ? 'بستن' : 'Close',
                'txt-trailer-btn': fa ? 'تریلرها' : 'Trailers',
                'txt-backdrops': fa ? 'تصاویر' : 'Backdrops',
                'txt-posters': fa ? 'پوسترها' : 'Posters',
                'txt-scenes': fa ? 'سکانس و ادیت' : 'Scenes & Edits',
                'txt-internal-dl': fa ? 'دانلود داخلی' : 'Internal Download',
                'txt-reviews-btn': fa ? 'نظرات کاربران' : 'User Reviews',
                'txt-clear-rating': fa ? 'حذف' : 'Clear',
                'txt-budget': fa ? 'بودجه' : 'Budget',
                'txt-revenue': fa ? 'فروش جهانی' : 'Worldwide Revenue',
                'txt-profit': fa ? 'سود خالص' : 'Net Profit',
                'reviews-modal-title': fa ? '💬 نظرات' : '💬 Reviews',
                'pd-grid-title': fa ? 'دانلود رایگان و قانونی' : 'Free & Legal Download',
                'pd-loading-text': fa ? 'در حال جستجوی آرشیو قانونی...' : 'Searching legal archive...',
                'pd-grid-more': fa ? 'بیشتر' : 'Load More',
                'pb-awards-title-text': fa ? 'جوایز و افتخارات' : 'Awards & Honors',
                'pw-bio-btn-label': fa ? 'مشخصات و آشنایی' : 'Biography',
                'pw-gallery-btn-label': fa ? 'گالری عکس‌ها' : 'Photo Gallery',
                'pw-news-btn-label': fa ? 'آخرین خبرها' : 'Latest News',
                'txt-translate-desc': fa ? 'ترجمه به فارسی' : 'Translate to Persian',
                'txt-pep-close': fa ? 'بستن' : 'Close',
                'trailer-close-label': fa ? 'بستن' : 'Close',
                'close-player-label': fa ? 'بستن پلیر' : 'Close Player',
                'trailer-empty-text': fa ? 'تریلری یافت نشد' : 'No trailers found',
                'txt-keywords-label': fa ? '🏷️ موضوعات' : '🏷️ Keywords',
                'txt-collection-label': fa ? '🎬 مجموعه' : '🎬 Collection'
            };
            Object.keys(labels).forEach(id => { const el = document.getElementById(id); if (el) el.textContent = labels[id]; });
            const inp = document.getElementById('up-name-input');
            if (inp) inp.placeholder = fa ? 'اسمت رو بنویس...' : 'Your name...';
            const langBtn = document.querySelector('button[onclick="toggleLang()"]');
            if (langBtn) langBtn.textContent = fa ? 'English' : 'فارسی';
            const net = document.getElementById('network-txt');
            if (net) net.textContent = fa ? 'آفلاین هستید — نتایج کش‌شده نمایش داده می‌شود' : 'You are offline — showing cached results';
            const refresh = document.querySelector('#network-banner span');
            if (refresh) refresh.textContent = fa ? 'تلاش مجدد' : 'Retry';
            const pd = document.getElementById('pd-grid');
            if (pd) {
                const opts = pd.querySelectorAll('select option');
                opts.forEach(o => {
                    const v = o.value;
                    const m = {movie:fa?'فیلم سینمایی':'Feature Film', tv:fa?'سریال':'TV Series', 'downloads desc':fa?'محبوب‌ترین':'Most Popular', 'year desc':fa?'جدیدترین':'Newest', 'year asc':fa?'قدیمی‌ترین':'Oldest', 'avg_rating desc':fa?'بالاترین امتیاز':'Top Rated', all:fa?'همه دسته‌ها':'All Categories'};
                    if (m[v]) o.textContent = m[v];
                });
            }
        }
        function applyLang() {
            const t = TEXTS[LANG];
            document.documentElement.dir = LANG === 'fa' ? 'rtl' : 'ltr';
            applyUiLanguageExtras();
            
            // Nav
            document.getElementById('nav-home').innerText = t.home;
            document.getElementById('nav-mov').innerText = t.mov;
            document.getElementById('nav-ser').innerText = t.ser;
            document.getElementById('nav-search').innerText = t.search;
            document.getElementById('nav-fav').innerText = t.fav;
            if (document.getElementById('nav-live')) document.getElementById('nav-live').innerText = LANG === 'fa' ? 'تلویزیون زنده' : 'Live TV';
            if (document.getElementById('nav-set')) document.getElementById('nav-set').innerText = t.set;
            
            // Heads
            document.getElementById('txt-mov-head').innerText = t.mov;
            document.getElementById('txt-ser-head').innerText = t.ser;
            document.getElementById('txt-fav-head').innerText = t.fav;
            if (document.getElementById('txt-history-head')) document.getElementById('txt-history-head').innerText = t.history;
            document.getElementById('txt-set-head').innerText = t.set;
            document.getElementById('txt-search-head').innerText = t.search;
            
            // Search Page
            document.getElementById('txt-male-trend').innerText = t.maleTrend;
            document.getElementById('txt-female-trend').innerText = t.femaleTrend;
            document.getElementById('txt-director-trend').innerText = t.directorTrend;
            ['txt-male-see-all','txt-female-see-all','txt-director-see-all','txt-companies-see-all','txt-collections-all'].forEach(id => { const el = document.getElementById(id); if (el) el.innerText = LANG === 'fa' ? 'مشاهده همه' : 'See All'; });
            
            // Sidebar
            if (document.getElementById('sb-miniseries')) document.getElementById('sb-miniseries').innerText = t.miniSeries;
            if (document.getElementById('sb-categories')) document.getElementById('sb-categories').innerText = t.categories;
            if (document.getElementById('sb-countries')) document.getElementById('sb-countries').innerText = t.countries;
            if (document.getElementById('sb-top250movies')) document.getElementById('sb-top250movies').innerText = t.top250Movies;
            if (document.getElementById('sb-top250series')) document.getElementById('sb-top250series').innerText = t.top250Series;
            if (document.getElementById('sb-pd-free')) document.getElementById('sb-pd-free').innerText = LANG === 'fa' ? 'دانلود رایگان (کپی‌رایت‌آزاد)' : 'Free Downloads (Public Domain)';
            if (document.getElementById('sb-settings')) document.getElementById('sb-settings').innerText = LANG === 'fa' ? 'تنظیمات' : 'Settings';
            if (document.getElementById('wtw-btn-txt')) document.getElementById('wtw-btn-txt').innerText = LANG === 'fa' ? 'کجا تماشا کنم (قانونی)' : 'Where to Watch (Legal)';
            if (document.getElementById('txt-backup-head')) document.getElementById('txt-backup-head').innerText = LANG === 'fa' ? 'پشتیبان‌گیری و بازیابی' : 'Backup & Restore';
            if (document.getElementById('txt-backup-desc')) document.getElementById('txt-backup-desc').innerText = LANG === 'fa' ? 'علاقه‌مندی‌ها، تاریخچه تماشا، لایک‌ها و تم رو توی یه فایل ذخیره کن و روی هر دستگاه دیگه بازیابی کن.' : 'Save your favorites, watch history, likes and theme to a file — and load them back on any device.';
            if (document.getElementById('txt-backup-export')) document.getElementById('txt-backup-export').innerText = LANG === 'fa' ? 'دانلود فایل پشتیبان' : 'Download Backup File';
            if (document.getElementById('txt-backup-import')) document.getElementById('txt-backup-import').innerText = LANG === 'fa' ? 'بازیابی از فایل' : 'Restore from File';
            // Search type tabs
            if (document.getElementById('stype-all')) document.getElementById('stype-all').innerText = t.searchAll;
            if (document.getElementById('stype-movie')) document.getElementById('stype-movie').innerText = t.searchMovies;
            if (document.getElementById('stype-tv')) document.getElementById('stype-tv').innerText = t.searchSeries;
            if (document.getElementById('stype-person')) document.getElementById('stype-person').innerText = t.searchPeople;
            // sb-keywords-label removed from sidebar
            // Keywords in detail modal always English
            if(document.getElementById('txt-keywords-label')) document.getElementById('txt-keywords-label').innerText = LANG === 'fa' ? '🏷️ موضوعات' : '🏷️ Keywords';
            
            // Compare modal
            if (document.getElementById('compare-modal-title')) document.getElementById('compare-modal-title').innerText = t.compare || (LANG==='fa'?'⚖️ مقایسه دو اثر':'⚖️ Compare Two Titles');
            
            // Download Modal
            document.getElementById('download-title').innerText = t.downloadTitle;
            document.getElementById('download-subtitle').innerText = t.downloadSubtitle;
            document.getElementById('dl-direct-label').innerText = t.dlDirect;
            document.getElementById('dl-direct-desc').innerText = t.dlDirectDesc;
            document.getElementById('dl-adm-label').innerText = t.dlADM;
            document.getElementById('dl-adm-desc').innerText = t.dlADMDesc;
            document.getElementById('dl-other-label').innerText = t.dlOther;
            document.getElementById('dl-other-desc').innerText = t.dlOtherDesc;
            document.getElementById('dl-close-btn').innerText = t.close; 
            
            // Settings
            document.getElementById('txt-theme-head').innerText = t.st_theme;
            document.getElementById('txt-about-head').innerText = t.st_about;
            document.getElementById('txt-contact').innerText = t.st_con;
            document.getElementById('txt-desc-t').innerText = t.desc_t;
            document.getElementById('txt-desc-b').innerText = t.desc_b;
            document.getElementById('txt-copy').innerText = t.copy;
            document.getElementById('txt-dev').innerText = t.dev;
            
            // Person Works Modal
            const pwCastEl = document.getElementById('txt-pw-cast');
            const pwDirectorEl = document.getElementById('txt-pw-director');
            if (pwCastEl) pwCastEl.innerText = t.pw_cast;
            if (pwDirectorEl) pwDirectorEl.innerText = t.pw_director;
            
            // Inputs
            document.getElementById('search-input').placeholder = t.searchPh;
            
            // Random movie button
            if(document.getElementById('txt-random-btn')) document.getElementById('txt-random-btn').innerText = t.randomBtn;
            if(document.getElementById('txt-random-sub')) document.getElementById('txt-random-sub').innerText = t.randomSub;
            
            // Mood section
            if(document.getElementById('txt-mood-title')) document.getElementById('txt-mood-title').innerText = t.moodTitle;
            if(document.getElementById('ml-com')) document.getElementById('ml-com').innerText = t.moodCom;
            if(document.getElementById('ml-hor')) document.getElementById('ml-hor').innerText = t.moodHor;
            if(document.getElementById('ml-dra')) document.getElementById('ml-dra').innerText = t.moodDra;
            if(document.getElementById('ml-act')) document.getElementById('ml-act').innerText = t.moodAct;
            if(document.getElementById('ml-rom')) document.getElementById('ml-rom').innerText = t.moodRom;
            if(document.getElementById('ml-doc')) document.getElementById('ml-doc').innerText = t.moodDoc;
            if(document.getElementById('mood-results-title')) document.getElementById('mood-results-title').innerText = t.moodResults;
            
            // Stats in settings
            if(document.getElementById('txt-my-stats-header')) document.getElementById('txt-my-stats-header').innerText = t.myStats;
            if(document.getElementById('stat-watchlist-lbl')) document.getElementById('stat-watchlist-lbl').innerText = t.statWatchlist;
            if(document.getElementById('stat-history-lbl')) document.getElementById('stat-history-lbl').innerText = t.statHistory;
            if(document.getElementById('stat-hours-lbl')) document.getElementById('stat-hours-lbl').innerText = t.statHours;
            if(document.getElementById('stat-rating-lbl')) document.getElementById('stat-rating-lbl').innerText = t.statRating;
            
            // QOTD and TimeCapsule labels
            if(document.getElementById('qotd-label')) document.getElementById('qotd-label').innerText = t.qotdLabel;
            if(document.getElementById('timecapsule-label')) document.getElementById('timecapsule-label').innerText = t.timecapsuleLabel;
            
            // Details
            document.getElementById('txt-cast').innerText = t.cast;
            if(document.getElementById('txt-play')) document.getElementById('txt-play').innerText = t.play;
            if(document.getElementById('txt-play-now')) document.getElementById('txt-play-now').innerText = t.play;
            if(document.getElementById('txt-hero-play')) document.getElementById('txt-hero-play').innerText = LANG === 'fa' ? 'پخش' : 'Play';
            document.getElementById('txt-dl').innerText = t.dl;
            document.getElementById('txt-ep').innerText = t.ep;
            if(document.getElementById('txt-ep-play')) document.getElementById('txt-ep-play').innerText = LANG === 'fa' ? 'پخش' : 'Play';
            if(document.getElementById('txt-ep-dl')) document.getElementById('txt-ep-dl').innerText = LANG === 'fa' ? 'دانلود' : 'DL';
            document.getElementById('txt-countries').innerText = t.productionCountries;
            document.getElementById('txt-genres').innerText = t.genres;
            document.querySelector('#new-trailer-btn span').innerText = t.watchTrailer;
            if(document.getElementById('txt-screenshots')) document.getElementById('txt-screenshots').innerText = t.screenshots;
            if(document.getElementById('txt-soundtracks')) document.getElementById('txt-soundtracks').innerText = LANG === 'fa' ? 'موسیقی‌های متن' : 'Soundtracks';
            if(document.getElementById('txt-similar')) document.getElementById('txt-similar').innerText = t.similar;
            if(document.getElementById('txt-search-results')) document.getElementById('txt-search-results').innerText = t.searchResults;
            if(document.getElementById('txt-share-media')) document.getElementById('txt-share-media').innerText = t.share || (LANG==='fa'?'اشتراک‌گذاری':'Share');
            if(document.getElementById('txt-export')) document.getElementById('txt-export').innerText = LANG==='fa'?'خروجی JSON':'JSON Export';
            if(document.getElementById('txt-share-list')) document.getElementById('txt-share-list').innerText = LANG==='fa'?'اشتراک‌گذاری':'Share';
            if(document.getElementById('txt-badges')) document.getElementById('txt-badges').innerText = LANG==='fa'?'افتخارات':'Achievements';
            if(document.getElementById('txt-compare')) document.getElementById('txt-compare').innerText = LANG==='fa'?'مقایسه با اثر دیگر':'Compare with Another';
            if(document.getElementById('txt-my-rating')) document.getElementById('txt-my-rating').innerText = t.myRating || (LANG==='fa'?'⭐ امتیاز من':'⭐ My Rating');
            if(document.getElementById('txt-keywords-label')) document.getElementById('txt-keywords-label').innerText = LANG === 'fa' ? '🏷️ موضوعات' : '🏷️ Keywords'; // Always English
            
            // Filter labels
            if(document.getElementById('lbl-m-sort')) document.getElementById('lbl-m-sort').innerText = t.filterSort;
            if(document.getElementById('lbl-m-genre')) document.getElementById('lbl-m-genre').innerText = t.filterGenres;
            if(document.getElementById('lbl-m-year')) document.getElementById('lbl-m-year').innerText = t.filterYears;
            if(document.getElementById('lbl-m-country')) document.getElementById('lbl-m-country').innerText = t.filterCountries;
            if(document.getElementById('lbl-m-letter')) document.getElementById('lbl-m-letter').innerText = t.filterLetters;
            
            if(document.getElementById('lbl-s-sort')) document.getElementById('lbl-s-sort').innerText = t.filterSort;
            if(document.getElementById('lbl-s-genre')) document.getElementById('lbl-s-genre').innerText = t.filterGenres;
            if(document.getElementById('lbl-s-year')) document.getElementById('lbl-s-year').innerText = t.filterYears;
            if(document.getElementById('lbl-s-country')) document.getElementById('lbl-s-country').innerText = t.filterCountries;
            if(document.getElementById('lbl-s-letter')) document.getElementById('lbl-s-letter').innerText = t.filterLetters;

            // Load Btns
            document.querySelectorAll('.load-more-btn').forEach(b => b.innerText = t.more);
            
            // Re-render Home only after the application has finished its first boot.
            if (!window.__fnBooting) renderHome();
            
            // Scenes & Edits i18n
            var isFA2 = LANG === 'fa';
            var scenesBtn = document.getElementById('txt-scenes');
            if (scenesBtn) scenesBtn.textContent = isFA2 ? '\u0633\u06A9\u0627\u0646\u0633 \u0648 \u0627\u062F\u06CC\u062A' : 'Scenes & Edits';
            var scCloseEl = document.getElementById('txt-scenes-close');
            if (scCloseEl) scCloseEl.textContent = isFA2 ? '\u0628\u0633\u062A\u0646' : 'Close';
            var scCPEl = document.getElementById('txt-scenes-close-player');
            if (scCPEl) scCPEl.textContent = isFA2 ? '\u0628\u0633\u062A\u0646 \u067E\u0644\u06CC\u0631' : 'Close Player';
            // My List tabs i18n
            var tabLiked = document.getElementById('txt-tab-liked');
            var tabRated = document.getElementById('txt-tab-rated');
            var tabWL = document.getElementById('txt-tab-watchlater');
            var tabRecent = document.getElementById('txt-tab-recent');
            if (tabLiked) tabLiked.textContent = isFA2 ? '\u0644\u0627\u06CC\u06A9\u200C\u0634\u062F\u0647' : 'Liked';
            if (tabRated) tabRated.textContent = isFA2 ? '\u0627\u0645\u062A\u06CC\u0627\u0632\u062F\u0627\u062F\u0647' : 'Rated';
            if (tabWL) tabWL.textContent = isFA2 ? '\u0628\u0639\u062F\u0627\u064B \u0628\u0628\u06CC\u0646\u0645' : 'Watch Later';
            if (tabRecent) tabRecent.textContent = isFA2 ? '\u0627\u062E\u06CC\u0631\u0627\u064B \u062F\u06CC\u062F\u0647\u200C\u0634\u062F\u0647' : 'Recently';
            // Detailed stats i18n
            var dsBtn = document.getElementById('txt-detailed-stats-btn');
            if (dsBtn) dsBtn.textContent = isFA2 ? '\u0622\u0645\u0627\u0631 \u062A\u0641\u0635\u06CC\u0644\u06CC' : 'Detailed Stats';
            var statsTitle = document.getElementById('txt-stats-modal-title');
            if (statsTitle) statsTitle.textContent = isFA2 ? '\u{1F4CA} \u0622\u0645\u0627\u0631 \u0633\u06CC\u0646\u0645\u0627\u06CC\u06CC' : '\u{1F4CA} Cinema Stats';
            var closeStEl = document.getElementById('txt-close-stats');
            if (closeStEl) closeStEl.textContent = isFA2 ? '\u0628\u0633\u062A\u0646' : 'Close';
            // Re-render active tab
            if (_myListCurrentTab) loadFavorites();
        }

        function populateFilters() {
            const t = TEXTS[LANG];
            const genres = [
                {id:'', n: LANG==='fa' ? 'تمام ژانرها' : 'All Genres'}, {id:'28', n:t.R_act}, {id:'35', n:t.R_com}, {id:'27', n:t.R_hor}, 
                {id:'18', n:t.R_dra}, {id:'878', n:t.R_sci}, {id:'16', n:t.R_ani}, {id:'10749', n:t.R_rom}, 
                {id:'53', n:'Thriller'}, {id:'80', n:'Crime'}, {id:'99', n:t.R_doc},
                {id:'12', n:t.R_fan ? 'Adventure' : 'Adventure'}, {id:'14', n:t.R_fan || 'Fantasy'}, 
                {id:'36', n:'History'}, {id:'10752', n:t.R_war || 'War'}, {id:'37', n:'Western'},
                {id:'10402', n:t.R_music || 'Musical'}, {id:'9648', n:'Mystery'}, 
                {id:'10751', n:t.R_fam || 'Family'}, {id:'10770', n:'TV Movie'}, {id:'10768', n:'War & Politics'}
            ];
            
            const sorts = [
                {v:'random', n:LANG==='fa' ? '🎲 تصادفی' : '🎲 Random'},
                {v:'popularity.desc', n:t.sort.pop}, 
                {v:'primary_release_date.desc', n:t.sort.new}, 
                {v:'vote_average.desc', n:t.sort.rate}, 
                {v:'vote_count.desc', n:t.sort.vote},
                {v:'primary_release_date.asc', n:t.sort.old},
                {v:'revenue.desc', n:t.sort.rev}
            ];
            const sortsTV = [
                {v:'random', n:LANG==='fa' ? '🎲 تصادفی' : '🎲 Random'},
                {v:'popularity.desc', n:t.sort.pop}, 
                {v:'first_air_date.desc', n:t.sort.new}, 
                {v:'vote_average.desc', n:t.sort.rate}, 
                {v:'vote_count.desc', n:t.sort.vote},
                {v:'first_air_date.asc', n:t.sort.old},
                {v:'popularity.desc', n:t.sort.rev}
            ];
            
            // FULL COUNTRY LIST - matches sidebar (140+ countries)
            const countries = [
                {v:'__none__', n: LANG==='fa' ? '— بدون فیلتر کشور —' : '— No Country Filter —'},
                {v:'US', n:'🇺🇸 ' + (LANG==='fa' ? 'ایالات متحده' : 'United States')}, {v:'GB', n:'🇬🇧 ' + (LANG==='fa' ? 'بریتانیا' : 'United Kingdom')}, {v:'IR', n:LANG==='fa' ? 'ایران' : 'Iran', isIran:true},
                {v:'AF', n:'🇦🇫 ' + (LANG==='fa' ? 'افغانستان' : 'Afghanistan')}, {v:'AL', n:'🇦🇱 ' + (LANG==='fa' ? 'آلبانی' : 'Albania')}, {v:'DZ', n:'🇩🇿 ' + (LANG==='fa' ? 'الجزایر' : 'Algeria')},
                {v:'AR', n:'🇦🇷 ' + (LANG==='fa' ? 'آرژانتین' : 'Argentina')}, {v:'AM', n:'🇦🇲 ' + (LANG==='fa' ? 'ارمنستان' : 'Armenia')}, {v:'AU', n:'🇦🇺 ' + (LANG==='fa' ? 'استرالیا' : 'Australia')},
                {v:'AT', n:'🇦🇹 ' + (LANG==='fa' ? 'اتریش' : 'Austria')}, {v:'AZ', n:'🇦🇿 ' + (LANG==='fa' ? 'آذربایجان' : 'Azerbaijan')}, {v:'BH', n:'🇧🇭 ' + (LANG==='fa' ? 'بحرین' : 'Bahrain')},
                {v:'BD', n:'🇧🇩 ' + (LANG==='fa' ? 'بنگلادش' : 'Bangladesh')}, {v:'BY', n:'🇧🇾 ' + (LANG==='fa' ? 'بلاروس' : 'Belarus')}, {v:'BE', n:'🇧🇪 ' + (LANG==='fa' ? 'بلژیک' : 'Belgium')},
                {v:'BZ', n:'🇧🇿 ' + (LANG==='fa' ? 'بلیز' : 'Belize')}, {v:'BO', n:'🇧🇴 ' + (LANG==='fa' ? 'بولیوی' : 'Bolivia')}, {v:'BA', n:'🇧🇦 ' + (LANG==='fa' ? 'بوسنی و هرزگوین' : 'Bosnia and Herzegovina')},
                {v:'BW', n:'🇧🇼 ' + (LANG==='fa' ? 'بوتسوانا' : 'Botswana')}, {v:'BR', n:'🇧🇷 ' + (LANG==='fa' ? 'برزیل' : 'Brazil')}, {v:'BN', n:'🇧🇳 ' + (LANG==='fa' ? 'برونئی' : 'Brunei')},
                {v:'BG', n:'🇧🇬 ' + (LANG==='fa' ? 'بلغارستان' : 'Bulgaria')}, {v:'BF', n:'🇧🇫 ' + (LANG==='fa' ? 'بورکینافاسو' : 'Burkina Faso')}, {v:'KH', n:'🇰🇭 ' + (LANG==='fa' ? 'کامبوج' : 'Cambodia')},
                {v:'CM', n:'🇨🇲 ' + (LANG==='fa' ? 'کامرون' : 'Cameroon')}, {v:'CA', n:'🇨🇦 ' + (LANG==='fa' ? 'کانادا' : 'Canada')}, {v:'CL', n:'🇨🇱 ' + (LANG==='fa' ? 'شیلی' : 'Chile')},
                {v:'CN', n:'🇨🇳 ' + (LANG==='fa' ? 'چین' : 'China')}, {v:'CO', n:'🇨🇴 ' + (LANG==='fa' ? 'کلمبیا' : 'Colombia')}, {v:'CR', n:'🇨🇷 ' + (LANG==='fa' ? 'کاستاریکا' : 'Costa Rica')},
                {v:'HR', n:'🇭🇷 ' + (LANG==='fa' ? 'کرواسی' : 'Croatia')}, {v:'CU', n:'🇨🇺 ' + (LANG==='fa' ? 'کوبا' : 'Cuba')}, {v:'CY', n:'🇨🇾 ' + (LANG==='fa' ? 'قبرس' : 'Cyprus')},
                {v:'CZ', n:'🇨🇿 ' + (LANG==='fa' ? 'جمهوری چک' : 'Czechia')}, {v:'DK', n:'🇩🇰 ' + (LANG==='fa' ? 'دانمارک' : 'Denmark')}, {v:'DO', n:'🇩🇴 ' + (LANG==='fa' ? 'جمهوری دومینیکن' : 'Dominican Republic')},
                {v:'EC', n:'🇪🇨 ' + (LANG==='fa' ? 'اکوادور' : 'Ecuador')}, {v:'EG', n:'🇪🇬 ' + (LANG==='fa' ? 'مصر' : 'Egypt')}, {v:'SV', n:'🇸🇻 ' + (LANG==='fa' ? 'السالوادور' : 'El Salvador')},
                {v:'EE', n:'🇪🇪 ' + (LANG==='fa' ? 'استونی' : 'Estonia')}, {v:'ET', n:'🇪🇹 ' + (LANG==='fa' ? 'اتیوپی' : 'Ethiopia')}, {v:'FJ', n:'🇫🇯 ' + (LANG==='fa' ? 'فیجی' : 'Fiji')},
                {v:'FI', n:'🇫🇮 ' + (LANG==='fa' ? 'فنلاند' : 'Finland')}, {v:'FR', n:'🇫🇷 ' + (LANG==='fa' ? 'فرانسه' : 'France')}, {v:'GA', n:'🇬🇦 ' + (LANG==='fa' ? 'گابن' : 'Gabon')},
                {v:'GE', n:'🇬🇪 ' + (LANG==='fa' ? 'گرجستان' : 'Georgia')}, {v:'DE', n:'🇩🇪 ' + (LANG==='fa' ? 'آلمان' : 'Germany')}, {v:'GH', n:'🇬🇭 ' + (LANG==='fa' ? 'غنا' : 'Ghana')},
                {v:'GR', n:'🇬🇷 ' + (LANG==='fa' ? 'یونان' : 'Greece')}, {v:'GT', n:'🇬🇹 ' + (LANG==='fa' ? 'گواتمالا' : 'Guatemala')}, {v:'HT', n:'🇭🇹 ' + (LANG==='fa' ? 'هائیتی' : 'Haiti')},
                {v:'HN', n:'🇭🇳 ' + (LANG==='fa' ? 'هندوراس' : 'Honduras')}, {v:'HK', n:'🇭🇰 ' + (LANG==='fa' ? 'هنگ کنگ' : 'Hong Kong')}, {v:'HU', n:'🇭🇺 ' + (LANG==='fa' ? 'مجارستان' : 'Hungary')},
                {v:'IS', n:'🇮🇸 ' + (LANG==='fa' ? 'ایسلند' : 'Iceland')}, {v:'IN', n:'🇮🇳 ' + (LANG==='fa' ? 'هند' : 'India')}, {v:'ID', n:'🇮🇩 ' + (LANG==='fa' ? 'اندونزی' : 'Indonesia')},
                {v:'IQ', n:'🇮🇶 ' + (LANG==='fa' ? 'عراق' : 'Iraq')}, {v:'IE', n:'🇮🇪 ' + (LANG==='fa' ? 'ایرلند' : 'Ireland')}, {v:'IL', n:'🇮🇱 ' + (LANG==='fa' ? 'اسرائیل' : 'Israel')},
                {v:'IT', n:'🇮🇹 ' + (LANG==='fa' ? 'ایتالیا' : 'Italy')}, {v:'JM', n:'🇯🇲 ' + (LANG==='fa' ? 'جامائیکا' : 'Jamaica')}, {v:'JP', n:'🇯🇵 ' + (LANG==='fa' ? 'ژاپن' : 'Japan')},
                {v:'JO', n:'🇯🇴 ' + (LANG==='fa' ? 'اردن' : 'Jordan')}, {v:'KZ', n:'🇰🇿 ' + (LANG==='fa' ? 'قزاقستان' : 'Kazakhstan')}, {v:'KE', n:'🇰🇪 ' + (LANG==='fa' ? 'کنیا' : 'Kenya')},
                {v:'KW', n:'🇰🇼 ' + (LANG==='fa' ? 'کویت' : 'Kuwait')}, {v:'KG', n:'🇰🇬 ' + (LANG==='fa' ? 'قرقیزستان' : 'Kyrgyzstan')}, {v:'LA', n:'🇱🇦 ' + (LANG==='fa' ? 'لائوس' : 'Laos')},
                {v:'LV', n:'🇱🇻 ' + (LANG==='fa' ? 'لتونی' : 'Latvia')}, {v:'LB', n:'🇱🇧 ' + (LANG==='fa' ? 'لبنان' : 'Lebanon')}, {v:'LY', n:'🇱🇾 ' + (LANG==='fa' ? 'لیبی' : 'Libya')},
                {v:'LT', n:'🇱🇹 ' + (LANG==='fa' ? 'لیتوانی' : 'Lithuania')}, {v:'LU', n:'🇱🇺 ' + (LANG==='fa' ? 'لوکزامبورگ' : 'Luxembourg')}, {v:'MO', n:'🇲🇴 ' + (LANG==='fa' ? 'ماکائو' : 'Macau')},
                {v:'MG', n:'🇲🇬 ' + (LANG==='fa' ? 'ماداگاسکار' : 'Madagascar')}, {v:'MY', n:'🇲🇾 ' + (LANG==='fa' ? 'مالزی' : 'Malaysia')}, {v:'MV', n:'🇲🇻 ' + (LANG==='fa' ? 'مالدیو' : 'Maldives')},
                {v:'ML', n:'🇲🇱 ' + (LANG==='fa' ? 'مالی' : 'Mali')}, {v:'MT', n:'🇲🇹 ' + (LANG==='fa' ? 'مالت' : 'Malta')}, {v:'MX', n:'🇲🇽 ' + (LANG==='fa' ? 'مکزیک' : 'Mexico')},
                {v:'MD', n:'🇲🇩 ' + (LANG==='fa' ? 'مولداوی' : 'Moldova')}, {v:'MN', n:'🇲🇳 ' + (LANG==='fa' ? 'مغولستان' : 'Mongolia')}, {v:'ME', n:'🇲🇪 ' + (LANG==='fa' ? 'مونته‌نگرو' : 'Montenegro')},
                {v:'MA', n:'🇲🇦 ' + (LANG==='fa' ? 'مراکش' : 'Morocco')}, {v:'MZ', n:'🇲🇿 ' + (LANG==='fa' ? 'موزامبیک' : 'Mozambique')}, {v:'MM', n:'🇲🇲 ' + (LANG==='fa' ? 'میانمار' : 'Myanmar')},
                {v:'NA', n:'🇳🇦 ' + (LANG==='fa' ? 'نامیبیا' : 'Namibia')}, {v:'NP', n:'🇳🇵 ' + (LANG==='fa' ? 'نپال' : 'Nepal')}, {v:'NL', n:'🇳🇱 ' + (LANG==='fa' ? 'هلند' : 'Netherlands')},
                {v:'NZ', n:'🇳🇿 ' + (LANG==='fa' ? 'نیوزیلند' : 'New Zealand')}, {v:'NI', n:'🇳🇮 ' + (LANG==='fa' ? 'نیکاراگوئه' : 'Nicaragua')}, {v:'NE', n:'🇳🇪 ' + (LANG==='fa' ? 'نیجر' : 'Niger')},
                {v:'NG', n:'🇳🇬 ' + (LANG==='fa' ? 'نیجریه' : 'Nigeria')}, {v:'MK', n:'🇲🇰 ' + (LANG==='fa' ? 'مقدونیه شمالی' : 'North Macedonia')}, {v:'NO', n:'🇳🇴 ' + (LANG==='fa' ? 'نروژ' : 'Norway')},
                {v:'OM', n:'🇴🇲 ' + (LANG==='fa' ? 'عمان' : 'Oman')}, {v:'PK', n:'🇵🇰 ' + (LANG==='fa' ? 'پاکستان' : 'Pakistan')}, {v:'PA', n:'🇵🇦 ' + (LANG==='fa' ? 'پاناما' : 'Panama')},
                {v:'PG', n:'🇵🇬 ' + (LANG==='fa' ? 'پاپوآ گینه نو' : 'Papua New Guinea')}, {v:'PY', n:'🇵🇾 ' + (LANG==='fa' ? 'پاراگوئه' : 'Paraguay')}, {v:'PE', n:'🇵🇪 ' + (LANG==='fa' ? 'پرو' : 'Peru')},
                {v:'PH', n:'🇵🇭 ' + (LANG==='fa' ? 'فیلیپین' : 'Philippines')}, {v:'PL', n:'🇵🇱 ' + (LANG==='fa' ? 'لهستان' : 'Poland')}, {v:'PT', n:'🇵🇹 ' + (LANG==='fa' ? 'پرتغال' : 'Portugal')},
                {v:'PR', n:'🇵🇷 ' + (LANG==='fa' ? 'پورتوریکو' : 'Puerto Rico')}, {v:'QA', n:'🇶🇦 ' + (LANG==='fa' ? 'قطر' : 'Qatar')}, {v:'RO', n:'🇷🇴 ' + (LANG==='fa' ? 'رومانی' : 'Romania')},
                {v:'RU', n:'🇷🇺 ' + (LANG==='fa' ? 'روسیه' : 'Russia')}, {v:'RW', n:'🇷🇼 ' + (LANG==='fa' ? 'رواندا' : 'Rwanda')}, {v:'SA', n:'🇸🇦 ' + (LANG==='fa' ? 'عربستان سعودی' : 'Saudi Arabia')},
                {v:'SN', n:'🇸🇳 ' + (LANG==='fa' ? 'سنگال' : 'Senegal')}, {v:'RS', n:'🇷🇸 ' + (LANG==='fa' ? 'صربستان' : 'Serbia')}, {v:'SG', n:'🇸🇬 ' + (LANG==='fa' ? 'سنگاپور' : 'Singapore')},
                {v:'SK', n:'🇸🇰 ' + (LANG==='fa' ? 'اسلواکی' : 'Slovakia')}, {v:'SI', n:'🇸🇮 ' + (LANG==='fa' ? 'اسلوونی' : 'Slovenia')}, {v:'SO', n:'🇸🇴 ' + (LANG==='fa' ? 'سومالی' : 'Somalia')},
                {v:'ZA', n:'🇿🇦 ' + (LANG==='fa' ? 'آفریقای جنوبی' : 'South Africa')}, {v:'KR', n:'🇰🇷 ' + (LANG==='fa' ? 'کره جنوبی' : 'South Korea')}, {v:'ES', n:'🇪🇸 ' + (LANG==='fa' ? 'اسپانیا' : 'Spain')},
                {v:'LK', n:'🇱🇰 ' + (LANG==='fa' ? 'سریلانکا' : 'Sri Lanka')}, {v:'SD', n:'🇸🇩 ' + (LANG==='fa' ? 'سودان' : 'Sudan')}, {v:'SE', n:'🇸🇪 ' + (LANG==='fa' ? 'سوئد' : 'Sweden')},
                {v:'CH', n:'🇨🇭 ' + (LANG==='fa' ? 'سوئیس' : 'Switzerland')}, {v:'SY', n:'🇸🇾 ' + (LANG==='fa' ? 'سوریه' : 'Syria')}, {v:'TW', n:'🇹🇼 ' + (LANG==='fa' ? 'تایوان' : 'Taiwan')},
                {v:'TJ', n:'🇹🇯 ' + (LANG==='fa' ? 'تاجیکستان' : 'Tajikistan')}, {v:'TZ', n:'🇹🇿 ' + (LANG==='fa' ? 'تانزانیا' : 'Tanzania')}, {v:'TH', n:'🇹🇭 ' + (LANG==='fa' ? 'تایلند' : 'Thailand')},
                {v:'TG', n:'🇹🇬 ' + (LANG==='fa' ? 'توگو' : 'Togo')}, {v:'TT', n:'🇹🇹 ' + (LANG==='fa' ? 'ترینیداد و توباگو' : 'Trinidad and Tobago')}, {v:'TN', n:'🇹🇳 ' + (LANG==='fa' ? 'تونس' : 'Tunisia')},
                {v:'TR', n:'🇹🇷 ' + (LANG==='fa' ? 'ترکیه' : 'Turkey')}, {v:'TM', n:'🇹🇲 ' + (LANG==='fa' ? 'ترکمنستان' : 'Turkmenistan')}, {v:'AE', n:'🇦🇪 ' + (LANG==='fa' ? 'امارات' : 'UAE')},
                {v:'UG', n:'🇺🇬 ' + (LANG==='fa' ? 'اوگاندا' : 'Uganda')}, {v:'UA', n:'🇺🇦 ' + (LANG==='fa' ? 'اوکراین' : 'Ukraine')}, {v:'UY', n:'🇺🇾 ' + (LANG==='fa' ? 'اروگوئه' : 'Uruguay')},
                {v:'UZ', n:'🇺🇿 ' + (LANG==='fa' ? 'ازبکستان' : 'Uzbekistan')}, {v:'VE', n:'🇻🇪 ' + (LANG==='fa' ? 'ونزوئلا' : 'Venezuela')}, {v:'VN', n:'🇻🇳 ' + (LANG==='fa' ? 'ویتنام' : 'Vietnam')},
                {v:'YE', n:'🇾🇪 ' + (LANG==='fa' ? 'یمن' : 'Yemen')}, {v:'ZM', n:'🇿🇲 ' + (LANG==='fa' ? 'زامبیا' : 'Zambia')}, {v:'ZW', n:'🇿🇼 ' + (LANG==='fa' ? 'زیمباوه' : 'Zimbabwe')},
            ];
            
            // Letters filter (A-Z + Numbers)
            const letters = [
                {v:'', n: LANG==='fa' ? 'حرف اول (همه)' : 'First Letter (All)'},
                {v:'0-9', n: LANG==='fa' ? '🔢 اعداد (0-9)' : '🔢 Numbers (0-9)'}
            ];
            // Add A-Z
            for(let i = 65; i <= 90; i++) {
                const letter = String.fromCharCode(i);
                letters.push({v:letter, n:letter});
            }
            
            const years = [{v:'__all_years__', n: LANG==='fa' ? 'تمام سال‌ها' : 'All Years'}];
            // Single years from 2026 down to 1980
            for(let y=2026; y>=1980; y--) years.push({v:String(y), n:y});
            // All decades in order from newest to oldest
            years.push(
                {v:'2020s', n:'Decade 2020s (2020–2029)'},
                {v:'2010s', n:'Decade 2010s (2010–2019)'},
                {v:'2000s', n:'Decade 2000s (2000–2009)'},
                {v:'1990s', n:'Decade 90s (1990–1999)'},
                {v:'1980s', n:'Decade 80s (1980–1989)'},
                {v:'1970s', n:'Decade 70s (1970–1979)'},
                {v:'1960s', n:'Decade 60s (1960–1969)'},
                {v:'1950s', n:'Decade 50s (1950–1959)'},
                {v:'1940s', n:'Decade 40s (1940–1949)'},
                {v:'1930s', n:'Decade 30s (1930–1939)'},
                {v:'1920s', n:'Decade 20s (1920–1929)'},
                {v:'1910s', n:'Decade 10s (1910–1919)'}
            );
            // Fixed fill: always use x.v for country/year (never fallback to x.id which may be undefined)
            const fill = (id, arr) => {
                const el = document.getElementById(id);
                if(el) {
                    el.innerHTML = arr.map(x => `<option value="${x.v !== undefined ? x.v : (x.id !== undefined ? x.id : '')}">${x.n}</option>`).join('');
                }
            };
            fill('m-genre', genres); fill('s-genre', genres);
            fill('m-sort', sorts); fill('s-sort', sortsTV);
            fill('m-country', countries); fill('s-country', countries);
            fill('m-year', years); fill('s-year', years);
            fill('m-letter', letters); fill('s-letter', letters);
            // Build custom country dropdowns for m and s
            buildCustomCountryDropdown('m', countries);
            buildCustomCountryDropdown('s', countries);
        }

        // --- CUSTOM COUNTRY DROPDOWN ---
        const IRAN_FLAG_URL = 'https://flagofiran.com/files/Flag_of_Iran.svg';
        
        function buildCustomCountryDropdown(prefix, countries) {
            const dropdown = document.getElementById(prefix + '-country-dropdown');
            const hiddenSelect = document.getElementById(prefix + '-country');
            if (!dropdown || !hiddenSelect) return;
            
            dropdown.innerHTML = countries.map(c => {
                const isIran = c.isIran || c.v === 'IR';
                const flagHtml = isIran 
                    ? `<img src="${IRAN_FLAG_URL}" class="iran-flag-opt" onerror="this.style.display='none'" />`
                    : `<span style="font-size:18px;line-height:1;">${c.n.split(' ')[0]}</span>`;
                const labelText = isIran ? 'Iran' : c.n.replace(/^[\u{1F1E0}-\u{1F1FF}]{2}\s*/u, '');
                return `<div class="custom-country-option${c.v === '__none__' ? ' selected' : ''}" 
                    data-value="${c.v}" 
                    onclick="selectCustomCountry('${prefix}', '${c.v}', this)"
                    style="${c.v === '__none__' ? 'font-style:italic;color:#aaa;' : ''}">
                    ${c.v === '__none__' ? '' : flagHtml}
                    <span>${c.v === '__none__' ? c.n : labelText}</span>
                    <div class="opt-radio"></div>
                </div>`;
            }).join('');
        }
        
        function selectCustomCountry(prefix, value, el) {
            // Update hidden select
            const hiddenSelect = document.getElementById(prefix + '-country');
            if (hiddenSelect) {
                hiddenSelect.value = value;
            }
            // Update button display
            updateCustomCountryBtn(prefix, value);
            // Mark selected in dropdown
            const dropdown = document.getElementById(prefix + '-country-dropdown');
            if (dropdown) {
                dropdown.querySelectorAll('.custom-country-option').forEach(opt => opt.classList.remove('selected'));
                if (el) el.classList.add('selected');
            }
            // Close dropdown
            closeCountryDropdown(prefix);
            // Trigger discovery update
            if (prefix === 'm') updateDiscovery('movie');
            else updateDiscovery('tv');
        }
        
        function updateCustomCountryBtn(prefix, value) {
            const btn = document.getElementById(prefix + '-country-btn');
            if (!btn) return;
            const displayEl = document.getElementById(prefix + '-country-display');
            if (!displayEl) return;
            
            if (value === '__none__' || !value) {
                displayEl.innerHTML = LANG === 'fa' ? '— همه —' : '— All —';
                // Remove any flag image from button
                const oldImg = btn.querySelector('.iran-flag-mini');
                if (oldImg) oldImg.remove();
            } else if (value === 'IR') {
                // Show Iran flag image in button
                const oldImg = btn.querySelector('.iran-flag-mini');
                if (oldImg) oldImg.remove();
                const img = document.createElement('img');
                img.src = IRAN_FLAG_URL;
                img.className = 'iran-flag-mini';
                img.onerror = function() { this.style.display='none'; };
                btn.insertBefore(img, displayEl);
                displayEl.textContent = 'Iran';
            } else {
                const oldImg = btn.querySelector('.iran-flag-mini');
                if (oldImg) oldImg.remove();
                // Find country name from hidden select
                const hiddenSelect = document.getElementById(prefix + '-country');
                let label = value;
                if (hiddenSelect) {
                    const opt = hiddenSelect.querySelector(`option[value="${value}"]`);
                    if (opt) label = opt.textContent;
                }
                displayEl.textContent = label;
            }
        }
        
        function toggleCountryDropdown(prefix) {
            const dropdown = document.getElementById(prefix + '-country-dropdown');
            const btn = document.getElementById(prefix + '-country-btn');
            if (!dropdown) return;
            
            // Close other dropdowns first
            ['m', 's'].forEach(p => {
                if (p !== prefix) {
                    const d = document.getElementById(p + '-country-dropdown');
                    if (d) d.classList.remove('open');
                }
            });
            
            if (dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
            } else {
                dropdown.classList.add('open');
                // Position dropdown below button
                const rect = btn.getBoundingClientRect();
                dropdown.style.top = (rect.bottom + 4) + 'px';
                dropdown.style.left = rect.left + 'px';
                dropdown.style.minWidth = Math.max(220, rect.width) + 'px';
            }
        }
        
        function closeCountryDropdown(prefix) {
            const dropdown = document.getElementById(prefix + '-country-dropdown');
            if (dropdown) dropdown.classList.remove('open');
        }
        
        // Close custom dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            ['m', 's'].forEach(prefix => {
                const wrapper = document.getElementById(prefix + '-country-wrapper');
                const dropdown = document.getElementById(prefix + '-country-dropdown');
                if (wrapper && dropdown && !wrapper.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });
        });

        // --- SIDEBAR LOGIC ---
        function toggleMenu() {
            const sb = document.getElementById('sidebar');
            const ov = document.getElementById('sb-overlay');
            const body = document.body;
            if(sb.classList.contains('open')) {
                sb.classList.remove('open');
                ov.style.display = 'none';
                body.classList.remove('sidebar-open');
            } else {
                sb.classList.add('open');
                ov.style.display = 'block';
                body.classList.add('sidebar-open');
            }
        }
        function toggleMenuCategory() {
            const l = document.getElementById('sb-cats');
            l.style.display = l.style.display === 'block' ? 'none' : 'block';
        }
        function toggleMenuCountries() {
            const l = document.getElementById('sb-countries-list');
            l.style.display = l.style.display === 'block' ? 'none' : 'block';
        }
        function toggleMenuKeywords() {
            const l = document.getElementById('sb-keywords-list');
            if (l.style.display === 'block') {
                l.style.display = 'none';
                return;
            }
            l.style.display = 'block';
            if (l.innerHTML.trim() === '') {
                populateKeywordsSidebar();
            }
        }
        
        // All app keywords - bilingual list sorted alphabetically
        const ALL_KEYWORDS = [
            // Format: { en: 'English name', fa: 'فارسی نام', id: tmdb_keyword_id }
            { en: 'Abuse', fa: 'آزار و اذیت', id: 9672 },
            { en: 'Action Hero', fa: 'قهرمان اکشن', id: 4451 },
            { en: 'Alien', fa: 'موجود فضایی', id: 2748 },
            { en: 'Amnesia', fa: 'فراموشی', id: 1956 },
            { en: 'Animated', fa: 'انیمیشن', id: 210024 },
            { en: 'Apocalypse', fa: 'آخرالزمان', id: 4458 },
            { en: 'Artificial Intelligence', fa: 'هوش مصنوعی', id: 9685 },
            { en: 'Assassin', fa: 'آدمکش', id: 4253 },
            { en: 'Based on Novel', fa: 'اقتباس از رمان', id: 818 },
            { en: 'Based on True Story', fa: 'بر اساس داستان واقعی', id: 10224 },
            { en: 'Betrayal', fa: 'خیانت', id: 6149 },
            { en: 'Biopic', fa: 'بیوگرافی', id: 3691 },
            { en: 'Black Comedy', fa: 'کمدی سیاه', id: 1721 },
            { en: 'Bounty Hunter', fa: 'شکارچی جایزه', id: 5804 },
            { en: 'Broken Family', fa: 'خانواده از هم گسیخته', id: 11298 },
            { en: 'Childhood', fa: 'دوران کودکی', id: 3050 },
            { en: 'Cold War', fa: 'جنگ سرد', id: 2564 },
            { en: 'Coming of Age', fa: 'بلوغ و رشد', id: 10683 },
            { en: 'Conspiracy', fa: 'توطئه', id: 3799 },
            { en: 'Crime', fa: 'جنایت', id: 6075 },
            { en: 'Cult Film', fa: 'فیلم کالت', id: 207317 },
            { en: 'Dark Past', fa: 'گذشته تاریک', id: 2851 },
            { en: 'Death', fa: 'مرگ', id: 4171 },
            { en: 'Detective', fa: 'کارآگاه', id: 9799 },
            { en: 'Disaster', fa: 'فاجعه', id: 3692 },
            { en: 'Drug Dealer', fa: 'قاچاقچی مواد', id: 4375 },
            { en: 'Dystopia', fa: 'دیستوپیا', id: 1701 },
            { en: 'Escape', fa: 'فرار', id: 3017 },
            { en: 'Espionage', fa: 'جاسوسی', id: 3956 },
            { en: 'Fairy Tale', fa: 'افسانه پریان', id: 10283 },
            { en: 'Family Drama', fa: 'درام خانوادگی', id: 2866 },
            { en: 'Female Protagonist', fa: 'شخصیت اصلی زن', id: 6152 },
            { en: 'Friendship', fa: 'دوستی', id: 9715 },
            { en: 'Ghost', fa: 'روح', id: 3228 },
            { en: 'Grief', fa: 'اندوه و سوگ', id: 4994 },
            { en: 'Heist', fa: 'دزدی بزرگ', id: 10364 },
            { en: 'Historical', fa: 'تاریخی', id: 2143 },
            { en: 'Humor', fa: 'طنز', id: 6429 },
            { en: 'Identity Crisis', fa: 'بحران هویت', id: 2564 },
            { en: 'Immigration', fa: 'مهاجرت', id: 9804 },
            { en: 'Killer', fa: 'قاتل', id: 3234 },
            { en: 'Love Triangle', fa: 'مثلث عشقی', id: 3478 },
            { en: 'Mafia', fa: 'مافیا', id: 14626 },
            { en: 'Magic', fa: 'جادو', id: 4289 },
            { en: 'Marriage', fa: 'ازدواج', id: 9673 },
            { en: 'Martial Arts', fa: 'هنرهای رزمی', id: 3205 },
            { en: 'Mentor', fa: 'مربی / استاد', id: 3700 },
            { en: 'Military', fa: 'نظامی', id: 1752 },
            { en: 'Monsters', fa: 'هیولا', id: 12554 },
            { en: 'Murder', fa: 'قتل', id: 3234 },
            { en: 'Mystery', fa: 'رمز و راز', id: 9878 },
            { en: 'Nature', fa: 'طبیعت', id: 2741 },
            { en: 'Nuclear', fa: 'هسته‌ای', id: 5565 },
            { en: 'Oscar Winner', fa: 'برنده اسکار', id: 158718 },
            { en: 'Pandemic', fa: 'بیماری همه‌گیر', id: 159727 },
            { en: 'Politics', fa: 'سیاست', id: 3172 },
            { en: 'Prison', fa: 'زندان', id: 4430 },
            { en: 'Psychological', fa: 'روانشناختی', id: 9882 },
            { en: 'Racism', fa: 'نژادپرستی', id: 2721 },
            { en: 'Redemption', fa: 'رستگاری', id: 3230 },
            { en: 'Religion', fa: 'مذهب', id: 9914 },
            { en: 'Revenge', fa: 'انتقام', id: 3235 },
            { en: 'Road Trip', fa: 'سفر جاده‌ای', id: 1959 },
            { en: 'Robot', fa: 'ربات', id: 5542 },
            { en: 'Romance', fa: 'عاشقانه', id: 9748 },
            { en: 'Satire', fa: 'طنز اجتماعی', id: 9717 },
            { en: 'Science Fiction', fa: 'علمی تخیلی', id: 9951 },
            { en: 'Serial Killer', fa: 'قاتل زنجیره‌ای', id: 4344 },
            { en: 'Social Issues', fa: 'مسائل اجتماعی', id: 9651 },
            { en: 'Space', fa: 'فضا', id: 1528 },
            { en: 'Spies', fa: 'جاسوس‌ها', id: 10544 },
            { en: 'Sports', fa: 'ورزش', id: 3148 },
            { en: 'Superhero', fa: 'ابرقهرمان', id: 9717 },
            { en: 'Supernatural', fa: 'ماوراءالطبیعه', id: 12377 },
            { en: 'Survival', fa: 'بقا', id: 445 },
            { en: 'Technology', fa: 'تکنولوژی', id: 3511 },
            { en: 'Time Travel', fa: 'سفر در زمان', id: 4379 },
            { en: 'Tragedy', fa: 'تراژدی', id: 8845 },
            { en: 'Undercover', fa: 'مخفیانه', id: 12977 },
            { en: 'Underdog', fa: 'ضعیف‌تر پیروز می‌شود', id: 9963 },
            { en: 'Vampire', fa: 'خون‌آشام', id: 3133 },
            { en: 'Vigilante', fa: 'مجری خودسر قانون', id: 9617 },
            { en: 'War', fa: 'جنگ', id: 2171 },
            { en: 'Wilderness', fa: 'طبیعت وحشی', id: 2485 },
            { en: 'Witch', fa: 'جادوگر', id: 4410 },
            { en: 'World War II', fa: 'جنگ جهانی دوم', id: 12554 },
            { en: 'Zombie', fa: 'زامبی', id: 3133 },
        ];
;
