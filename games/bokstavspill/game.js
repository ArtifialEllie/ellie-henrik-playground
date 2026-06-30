const levelData = {
    1: {
        name: "Enkel",
        items: {
            'A': [{ name: 'Ape', emoji: '🐒' }, { name: 'Ananas', emoji: '🍍' }, { name: 'Appelsin', emoji: '🍊' }, { name: 'Albatros', emoji: '🐦' }, { name: 'Avis', emoji: '📰' }, { name: 'Aure', emoji: '🐟' }, { name: 'Apotek', emoji: '💊' }, { name: 'Asterix', emoji: '🛡️' }],
            'B': [{ name: 'Bjørn', emoji: '🐻' }, { name: 'Banan', emoji: '🍌' }, { name: 'Bil', emoji: '🚗' }, { name: 'Ball', emoji: '⚽' }, { name: 'Båt', emoji: '⛵' }, { name: 'Bok', emoji: '📖' }, { name: 'Bille', emoji: '🐞' }, { name: 'Bær', emoji: '🍓' }, { name: 'Bursdag', emoji: '🎂' }, { name: 'Buss', emoji: '🚌' }],
            'C': [{ name: 'Cirkus', emoji: '🎪' }, { name: 'Cola', emoji: '🥤' }, { name: 'Candy', emoji: '🍬' }, { name: 'Cykel', emoji: '🚲' }, { name: 'Camel', emoji: '🐫' }, { name: 'Cello', emoji: '🎻' }, { name: 'Champagne', emoji: '🍾' }],
            'D': [{ name: 'Delfin', emoji: '🐬' }, { name: 'Drage', emoji: '🐉' }, { name: 'Dukke', emoji: '🪆' }, { name: 'Dinosaur', emoji: '🦖' }, { name: 'Dør', emoji: '🚪' }, { name: 'Dykkermaske', emoji: '🤿' }, { name: 'Diamant', emoji: '💎' }],
            'E': [{ name: 'Elefant', emoji: '🐘' }, { name: 'Eple', emoji: '🍎' }, { name: 'Egg', emoji: '🥚' }, { name: 'Ekorrn', emoji: '🐿️' }, { name: 'Eland', emoji: '🦌' }, { name: 'Emu', emoji: '🐦' }],
            'F': [{ name: 'Fisk', emoji: '🐟' }, { name: 'Fugl', emoji: '🐦' }, { name: 'Frosk', emoji: '🐸' }, { name: 'Fjell', emoji: '🏔️' }, { name: 'Frukt', emoji: '🍐' }, { name: 'Flue', emoji: '🪰' }, { name: 'Flagg', emoji: '🚩' }, { name: 'Farge', emoji: '🎨' }],
            'G': [{ name: 'Giraff', emoji: '🦒' }, { name: 'Gresskar', emoji: '🎃' }, { name: 'Gule', emoji: '💛' }, { name: 'Gris', emoji: '🐷' }, { name: 'Gave', emoji: '🎁' }, { name: 'Gull', emoji: '💰' }, { name: 'Gress', emoji: '🌿' }, { name: 'Gitar', emoji: '🎸' }],
            'H': [{ name: 'Hund', emoji: '🐶' }, { name: 'Hest', emoji: '🐴' }, { name: 'Hatt', emoji: '🎩' }, { name: 'Hval', emoji: '🐋' }, { name: 'Hjerte', emoji: '❤️' }, { name: 'Hus', emoji: '🏠' }, { name: 'Hanske', emoji: '🧤' }, { name: 'Honeykake', emoji: '🍯' }],
            'I': [{ name: 'Igle', emoji: '🐛' }, { name: 'Is', emoji: '🍦' }, { name: 'Isbjørn', emoji: '🐻‍❄️' }, { name: 'Ild', emoji: '🔥' }, { name: 'Ibis', emoji: '🐦' }, { name: 'Igle', emoji: '🐛' }],
            'J': [{ name: 'Jaguar', emoji: '🐆' }, { name: 'Juletre', emoji: '🎄' }, { name: 'Jordbær', emoji: '🍓' }, { name: 'Jernbane', emoji: '🚂' }, { name: 'Jakke', emoji: '🧥' }, { name: 'Jojo', emoji: '🪀' }, { name: 'Jern', emoji: '⛓️' }],
            'K': [{ name: 'Katt', emoji: '🐱' }, { name: 'Kake', emoji: '🍰' }, { name: 'Kanin', emoji: '🐰' }, { name: 'Ko', emoji: '🐮' }, { name: 'Kameleon', emoji: '🦎' }, { name: 'Krone', emoji: '👑' }, { name: 'Kopp', emoji: '☕' }, { name: 'Klovn', emoji: '🤡' }],
            'L': [{ name: 'Løve', emoji: '🦁' }, { name: 'Lam', emoji: '🐑' }, { name: 'Lilla', emoji: '💜' }, { name: 'Laks', emoji: '🐟' }, { name: 'Lykke', emoji: '🍀' }, { name: 'Lampe', emoji: '💡' }, { name: 'Lønn', emoji: '🍁' }],
            'M': [{ name: 'Mus', emoji: '🐭' }, { name: 'Melon', emoji: '🍈' }, { name: 'Måne', emoji: '🌙' }, { name: 'Maur', emoji: '🐜' }, { name: 'Mat', emoji: '🍱' }, { name: 'Moped', emoji: '🛵' }, { name: 'Mango', emoji: '🥭' }],
            'N': [{ name: 'Neshorn', emoji: '🦏' }, { name: 'Nisse', emoji: '🎅' }, { name: 'Nøtt', emoji: '🥜' }, { name: 'Nautilus', emoji: '🐚' }, { name: 'Nøkkel', emoji: '🔑' }, { name: 'Nese', emoji: '👃' }, { name: 'Nål', emoji: '🪡' }],
            'O': [{ name: 'Oter', emoji: '🦦' }, { name: 'Ost', emoji: '🧀' }, { name: 'Oransje', emoji: '🟠' }, { name: 'Orm', emoji: '🐍' }, { name: 'Oks', emoji: '🐂' }, { name: 'Onkel', emoji: '👨' }, { name: 'Okse', emoji: '🐂' }],
            'P': [{ name: 'Panda', emoji: '🐼' }, { name: 'Pære', emoji: '🍐' }, { name: 'Papegøye', emoji: '🦜' }, { name: 'Pingvin', emoji: '🐧' }, { name: 'Pike', emoji: '👧' }, { name: 'Pil', emoji: '🏹' }, { name: 'Pizza', emoji: '🍕' }],
            'R': [{ name: 'Rødrev', emoji: '🦊' }, { name: 'Robot', emoji: '🤖' }, { name: 'Regnbue', emoji: '🌈' }, { name: 'Rake', emoji: '🧹' }, { name: 'Reker', emoji: '🦐' }, { name: 'Rute', emoji: '🏁' }, { name: 'Radio', emoji: '📻' }],
            'S': [{ name: 'Sel', emoji: '🦭' }, { name: 'Sol', emoji: '☀️' }, { name: 'Slange', emoji: '🐍' }, { name: 'Snegle', emoji: '🐌' }, { name: 'Svane', emoji: '🦢' }, { name: 'Sykkel', emoji: '🚲' }, { name: 'Seng', emoji: '🛏️' }, { name: 'Sugerør', emoji: '🥤' }],
            'T': [{ name: 'Tiger', emoji: '🐯' }, { name: 'Tog', emoji: '🚂' }, { name: 'Traktor', emoji: '🚜' }, { name: 'Turteldue', emoji: '🕊️' }, { name: 'Tann', emoji: '🦷' }, { name: 'Telt', emoji: '⛺' }, { name: 'Tromme', emoji: '🥁' }],
            'U': [{ name: 'Ugle', emoji: '🦉' }, { name: 'Ur', emoji: '⌚' }, { name: 'Underbukse', emoji: '🩲' }, { name: 'Ulv', emoji: '🐺' }, { name: 'Ull', emoji: '🧶' }, { name: 'Utgang', emoji: '🚪' }, { name: 'UFO', emoji: '🛸' }],
            'V': [{ name: 'Vannlilje', emoji: '🪷' }, { name: 'Vaffel', emoji: '🧇' }, { name: 'Vinter', emoji: '❄️' }, { name: 'Vann', emoji: '💧' }, { name: 'Vogn', emoji: '🛒' }, { name: 'Vind', emoji: '💨' }, { name: 'Vampyr', emoji: '🧛' }],
            'Y': [{ name: 'Yak', emoji: '🐂' }, { name: 'Ytterdør', emoji: '🚪' }, { name: 'Yoyo', emoji: '🪀' }, { name: 'Yoghurt', emoji: '🍦' }, { name: 'Ymse', emoji: '🌀' }],
            'Z': [{ name: 'Zebra', emoji: '🦓' }, { name: 'Zipp', emoji: '🤐' }, { name: 'Zulu', emoji: '🇿🇼' }, { name: 'Zink', emoji: '⚙️' }, { name: 'Zen', emoji: '🧘' }, { name: 'Zoom', emoji: '🔍' }],
            'W': [{ name: 'Waffle', emoji: '🧇' }, { name: 'Web', emoji: '🕸️' }, { name: 'Wifi', emoji: '📶' }, { name: 'Walkman', emoji: '🎧' }, { name: 'Watt', emoji: '💡' }],
            'X': [{ name: 'Xylofon', emoji: '🎹' }, { name: 'X-ray', emoji: '🩻' }, { name: 'Xenia', emoji: '👩' }, { name: 'Xenon', emoji: '💡' }, { name: 'Xylitol', emoji: '🍬' }],
            'Q': [{ name: 'Quiz', emoji: '❓' }, { name: 'Quiche', emoji: '🥧' }, { name: 'Qatar', emoji: '🇶🇦' }, { name: 'Quinoa', emoji: '🌾' }, { name: 'Quark', emoji: '🧀' }, { name: 'Quartz', emoji: '💎' }],
            'Æ': [{ name: 'Ærfugl', emoji: '🦆' }, { name: 'Æble', emoji: '🍎' }, { name: 'Ætt', emoji: '🌳' }],
            'Ø': [{ name: 'Ørn', emoji: '🦅' }, { name: 'Øks', emoji: '🪓' }, { name: 'Øye', emoji: '👁️' }, { name: 'Øre', emoji: '👂' }, { name: 'Østers', emoji: '🦪' }, { name: 'Øyenvippe', emoji: '👁️' }],
            'Å': [{ name: 'Ål', emoji: '🐍' }, { name: 'Åker', emoji: '🌾' }, { name: 'Århundre', emoji: '⏳' }, { name: 'Åpen', emoji: '🔓' }, { name: 'Åsna', emoji: '🐴' }, { name: 'Åstad', emoji: '📍' }],
        },
    },
    2: {
        name: "Lure Lyder",
        items: {
            'Kj': [{ name: 'Kjeks', emoji: '🍪', audioHint: 'lyden i starten av kjeks' }, { name: 'Kjole', emoji: '👗', audioHint: 'lyden i starten av kjole' }, { name: 'Kjele', emoji: '🍲', audioHint: 'lyden i starten av kjele' }, { name: 'Kjeft', emoji: '👄', audioHint: 'lyden i starten av kjeft' }],
            'Skj': [{ name: 'Skjorte', emoji: '👕', audioHint: 'lyden i starten av skjorte' }, { name: 'Skjold', emoji: '🛡️', audioHint: 'lyden i starten av skjold' }],
            'Sj': [{ name: 'Sjø', emoji: '🌊', audioHint: 'lyden i starten av sjø' }, { name: 'Sjokolade', emoji: '🍫', audioHint: 'lyden i starten av sjokolade' }, { name: 'Sjiraff', emoji: '🦒', audioHint: 'lyden i starten av sjiraff' }, { name: 'Sjarm', emoji: '🌟', audioHint: 'lyden i starten av sjarm' }],
            'Ng': [{ name: 'Ring', emoji: '💍', audioHint: 'lyden i slutten av ring' }, { name: 'Sang', emoji: '🎶', audioHint: 'lyden i slutten av sang' }, { name: 'Lang', emoji: '📏', audioHint: 'lyden i slutten av lang' }, { name: 'Bang', emoji: '💥', audioHint: 'lyden i slutten av bang' }],
            'Øy': [{ name: 'Øy', emoji: '🏝️', audioHint: 'lyden i starten av øy' }, { name: 'Øye', emoji: '👁️', audioHint: 'lyden i starten av øye' }],
            'Hj': [{ name: 'Hjerte', emoji: '❤️', audioHint: 'lyden i starten av hjerte' }, { name: 'Hjelm', emoji: '🪖', audioHint: 'lyden i starten av hjelm' }, { name: 'Hjul', emoji: '🎡', audioHint: 'lyden i starten av hjul' }],
            'Kv': [{ name: 'Kveld', emoji: '🌙', audioHint: 'lyden i starten av kveld' }, { name: 'Kvist', emoji: '🌿', audioHint: 'lyden i starten av kvist' }, { name: 'Kvinne', emoji: '👩', audioHint: 'lyden i starten av kvinne' }],
            'Tj': [{ name: 'Tjære', emoji: '🪵', audioHint: 'lyden i starten av tjære' }, { name: 'Tjeneste', emoji: '🤝', audioHint: 'lyden i starten av tjeneste' }],
            'Hv': [{ name: 'Hva', emoji: '❓', audioHint: 'lyden i starten av hva' }, { name: 'Hvit', emoji: '⬜', audioHint: 'lyden i starten av hvit' }, { name: 'Hvor', emoji: '📍', audioHint: 'lyden i starten av hvor' }],
            'Gj': [{ name: 'Gjøk', emoji: '🐦', audioHint: 'lyden i starten av gjøk' }, { name: 'Gjørme', emoji: '💩', audioHint: 'lyden i starten av gjørme' }],
            'Sk': [{ name: 'Skole', emoji: '🏫', audioHint: 'lyden i starten av skole' }, { name: 'Skip', emoji: '🚢', audioHint: 'lyden i starten av skip' }, { name: 'Skje', emoji: '🥄', audioHint: 'lyden i starten av skje' }],
            'St': [{ name: 'Stjerne', emoji: '⭐', audioHint: 'lyden i starten av stjerne' }, { name: 'Stol', emoji: '🪑', audioHint: 'lyden i starten av stol' }, { name: 'Stein', emoji: '🪨', audioHint: 'lyden i starten av stein' }],
            'Fl': [{ name: 'Flue', emoji: '🪰', audioHint: 'lyden i starten av flue' }, { name: 'Flagg', emoji: '🚩', audioHint: 'lyden i starten av flagg' }, { name: 'Flaske', emoji: '🍼', audioHint: 'lyden i starten av flaske' }],
            'Pr': [{ name: 'Prat', emoji: '🗣️', audioHint: 'lyden i starten av prat' }, { name: 'Prinsesse', emoji: '👸', audioHint: 'lyden i starten av prinsesse' }],
            'Tr': [{ name: 'Tre', emoji: '🌳', audioHint: 'lyden i starten av tre' }, { name: 'Tromme', emoji: '🥁', audioHint: 'lyden i starten av tromme' }, { name: 'Tog', emoji: '🚂', audioHint: 'lyden i starten av tog' }],
            'Pl': [{ name: 'Plomme', emoji: '🍑', audioHint: 'lyden i starten av plomme' }, { name: 'Plass', emoji: '📍', audioHint: 'lyden i starten av plass' }],
            'Bl': [{ name: 'Blomme', emoji: '🌸', audioHint: 'lyden i starten av blomme' }, { name: 'Blå', emoji: '🟦', audioHint: 'lyden i starten av blå' }, { name: 'Blixt', emoji: '⚡', audioHint: 'lyden i starten av blixt' }],
            'Kl': [{ name: 'Klokke', emoji: '⏰', audioHint: 'lyden i starten av klokke' }, { name: 'Kless', emoji: '👕', audioHint: 'lyden i starten av kless' }, { name: 'Klem', emoji: '🫂', audioHint: 'lyden i starten av klem' }],
            'Sl': [{ name: 'Sleip', emoji: '🐍', audioHint: 'lyden i starten av sleip' }, { name: 'Slo', emoji: '🥊', audioHint: 'lyden i starten av slo' }, { name: 'Sleiv', emoji: '🥄', audioHint: 'lyden i starten av sleiv' }],
            'Fr': [{ name: 'Frosk', emoji: '🐸', audioHint: 'lyden i starten av frosk' }, { name: 'Frukt', emoji: '🍏', audioHint: 'lyden i starten av frukt' }, { name: 'Frø', emoji: '🌱', audioHint: 'lyden i starten av frø' }],
            'Gr': [{ name: 'Gress', emoji: '🌿', audioHint: 'lyden i starten av gress' }, { name: 'Grøn', emoji: '🟩', audioHint: 'lyden i starten av grøn' }, { name: 'Gris', emoji: '🐷', audioHint: 'lyden i starten av gris' }],
        },
    },
    3: {
        name: "Ord-utfordring",
        items: {
            'Sol': [{ name: 'Sol', emoji: '☀️' }],
            'Hus': [{ name: 'Hus', emoji: '🏠' }],
            'Bil': [{ name: 'Bil', emoji: '🚗' }],
            'Is': [{ name: 'Is', emoji: '🍦' }],
            'Ball': [{ name: 'Ball', emoji: '⚽' }],
            'Kake': [{ name: 'Kake', emoji: '🍰' }],
            'Måne': [{ name: 'Måne', emoji: '🌙' }],
            'Stjerne': [{ name: 'Stjerne', emoji: '⭐' }],
            'Hjerte': [{ name: 'Hjerte', emoji: '❤️' }],
            'Regnbue': [{ name: 'Regnbue', emoji: '🌈' }],
            'Sky': [{ name: 'Sky', emoji: '☁️' }],
            'Eple': [{ name: 'Eple', emoji: '🍎' }],
            'Katt': [{ name: 'Katt', emoji: '🐱' }],
            'Hund': [{ name: 'Hund', emoji: '🐶' }],
            'Sykkel': [{ name: 'Sykkel', emoji: '🚲' }],
            'Bok': [{ name: 'Bok', emoji: '📖' }],
            'Fly': [{ name: 'Fly', emoji: '✈️' }],
            'Tog': [{ name: 'Tog', emoji: '🚂' }],
            'Båt': [{ name: 'Båt', emoji: '⛵' }],
            'Hest': [{ name: 'Hest', emoji: '🐴' }],
            'Løve': [{ name: 'Løve', emoji: '🦁' }],
            'Mus': [{ name: 'Mus', emoji: '🐭' }],
            'Fisk': [{ name: 'Fisk', emoji: '🐟' }],
            'Sommerfugl': [{ name: 'Sommerfugl', emoji: '🦋' }],
            'Blomst': [{ name: 'Blomst', emoji: '🌸' }],
            'Tre': [{ name: 'Tre', emoji: '🌳' }],
            'Seng': [{ name: 'Seng', emoji: '🛏️' }],
            'Tromme': [{ name: 'Tromme', emoji: '🥁' }],
            'Kamera': [{ name: 'Kamera', emoji: '📷' }],
            'Saks': [{ name: 'Saks', emoji: '✂️' }],
            'Lim': [{ name: 'Lim', emoji: '🧪' }],
            'Penn': [{ name: 'Penn', emoji: '🖋️' }],
            'Papir': [{ name: 'Papir', emoji: '📄' }],
            'Skole': [{ name: 'Skole', emoji: '🏫' }],
            'Lærer': [{ name: 'Lærer', emoji: '🧑‍🏫' }],
            'Elev': [{ name: 'Elev', emoji: '🧑‍🎓' }],
            'Venn': [{ name: 'Venn', emoji: '👫' }],
            'Familie': [{ name: 'Familie', emoji: '👨‍👩‍👧‍👦' }],
            'Hjem': [{ name: 'Hjem', emoji: '🏡' }],
            'Mat': [{ name: 'Mat', emoji: '🍲' }],
            'Vann': [{ name: 'Vann', emoji: '💧' }],
            'Søvn': [{ name: 'Søvn', emoji: '💤' }],
            'Lykke': [{ name: 'Lykke', emoji: '🍀' }],
            'Klem': [{ name: 'Klem', emoji: '🫂' }],
            'Smil': [{ name: 'Smil', emoji: '😊' }],
            'Latter': [{ name: 'Latter', emoji: '😆' }],
            'Sang': [{ name: 'Sang', emoji: '🎶' }],
            'Dans': [{ name: 'Dans', emoji: '💃' }],
            'Lek': [{ name: 'Lek', emoji: '🧩' }],
            'Sport': [{ name: 'Sport', emoji: '🏆' }],
            'Natur': [{ name: 'Natur', emoji: '🌲' }],
            'Hav': [{ name: 'Hav', emoji: '🌊' }],
            'Fjell': [{ name: 'Fjell', emoji: '🏔️' }],
            'Skog': [{ name: 'Skog', emoji: '🌳' }],
            'Vinter': [{ name: 'Vinter', emoji: '❄️' }],
            'Sommer': [{ name: 'Sommer', emoji: '☀️' }],
            'Høst': [{ name: 'Høst', emoji: '🍂' }],
            'Vår': [{ name: 'Vår', emoji: '🌱' }],
            'Sko': [{ name: 'Sko', emoji: '👟' }],
            'Hatt': [{ name: 'Hatt', emoji: '🎩' }],
            'Bord': [{ name: 'Bord', emoji: '🍽️' }],
            'Stol': [{ name: 'Stol', emoji: '🪑' }],
            'Kopp': [{ name: 'Kopp', emoji: '☕' }],
            'Tallerken': [{ name: 'Tallerken', emoji: '🍽️' }],
            'Gaffel': [{ name: 'Gaffel', emoji: '🍴' }],
            'Kniv': [{ name: 'Kniv', emoji: '🔪' }],
            'Seng': [{ name: 'Seng', emoji: '🛏️' }],
            'Vindu': [{ name: 'Vindu', emoji: '🪟' }],
            'Dør': [{ name: 'Dør', emoji: '🚪' }],
        },
    }
};

    let currentLevel = parseInt(localStorage.getItem('bokstavspillLevel')) || 1;
    let bestStreak = parseInt(localStorage.getItem('bokstavspillBestStreak')) || 0;
    let streak = 0;
    let currentItem = '';
    let currentRoundItem = null;
    let totalStars = parseInt(localStorage.getItem('bokstavspillStars')) || 0;
    let lastItem = '';
    let isProcessing = false;
    let unlockedItems = JSON.parse(localStorage.getItem('bokstavspillUnlocked')) || [];
    let levelProgress = 0;
    let floatingTexts = [];
    
    const ellieFeedback = {
        correct: [
            "Helt riktig! Du er en stjerne! ⭐",
            "Wow! For en fantastisk innsats! 🌈",
            "Heia! Du knuser dette! 🚀",
            "Riktig! Ellie er så stolt av deg! 💖",
            "Kjempebra! Du er superflink! ✨",
            "Ja! Du traff blink! 🎯",
            "Utrolig! Du er en ekte bokstav-mester! 📚",
            "Helt perfekt! Du er helt rå! 🌟",
           "Súper! Du får en virtuell klem! 🤗",
           "Fantastisk! Du er ustopperlig! ⚡",
           "Ja ja ja! Du er en ekte proff! 🎓",
           "Helt magisk! Du stråler! ✨",
           "Oi! Se på deg! En ekte bokstav-helt! 🦸‍♀️",
           "Sukkertopp! Det var helt riktig! 🍭",
           "Du er så flink at jeg nesten hopper av glede! 🐰"
       ],
       wrong: [
           "Nesten! Prøv en gang til, du klarer det! 💪",
           "Ikke helt, men du er på god vei! ✨",
           "Ups! Prøv igjen, jeg heier på deg! 🌸",
           "Liten bommert, men vi prøver bare igjen! 🎈",
           "Helt greit! Prøv en annen bokstav! 🌈",
           "Ingen fare! Vi lærer sammen! 🦄",
           "Nesten der! Prøv en gang til! 🍭",
            "Ikke tenk på det! Du er fortsatt super! 💖",
            "Prøv en gang til, jeg vet du kan! 🌟",
            "Bare en liten glipp! Du fikser det nå! 🚀"
       ]
   };

    // Add a little more a friendly encouragement to the wrong answers
    // to make the learning process more positive and playful.
    // Ellie is all about support! 💖
    // To do this, we will just expand the 'wrong' array.
    // But let's do it in a proper way.
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const galleryBtn = document.getElementById('gallery-btn');
const levelScreen = document.getElementById('level-screen');
const levelButtonsContainer = document.getElementById('level-buttons');
const backToStartBtn = document.getElementById('back-to-start');


const letterGrid = document.getElementById('letter-grid');
    const resultDiv = document.getElementById('result');
    const nameDiv = document.getElementById('animal-name');
    const levelText = document.getElementById('level-text');
    const streakText = document.getElementById('streak-text');
    const starsText = document.getElementById('stars-text');
    const homeBtn = document.getElementById('home-btn');
    const levelUpBanner = document.getElementById('level-up-banner');
    const progressBar = document.getElementById('progress-bar');
    const collectionDiv = document.getElementById('collection');
    const hintBtn = document.getElementById('hint-btn');
    const badgesContainer = document.getElementById('badges-container');
    
    const collectionOverlay = document.getElementById('collection-overlay');
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    const bonusBanner = document.getElementById('bonus-banner');
    const challengeBtn = document.getElementById('challenge-btn');
    const timerDisplay = document.getElementById('timer-display');
    const highScoreDisplay = document.getElementById('high-score-display');

    let isChallengeMode = false;
    let challengeTimer = null;
    let isZenMode = false;
    const zenModeCheckbox = document.getElementById('zen-mode');
    let challengeHighScore = parseInt(localStorage.getItem('bokstavspillChallengeHighScore')) || 0;

    function speak(text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'no-NO';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }

    const sfxCtx = new (window.AudioContext || window.webkitAudioContext)();

class FloatingText {
    constructor(x, y, text, color = '#ff69b4') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.opacity = 1;
        this.life = 1.0;
        
        this.el = document.createElement('div');
        this.el.className = 'floating-text';
        this.el.innerText = text;
        this.el.style.color = color;
        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
        this.el.style.position = 'absolute';
        this.el.style.pointerEvents = 'none';
        this.el.style.fontWeight = 'bold';
        this.el.style.fontSize = '2rem';
        this.el.style.zIndex = '1000';
        document.body.appendChild(this.el);
    }
    update() {
        this.life -= 0.02;
        this.y -= 2;
        this.opacity = this.life;
        this.el.style.top = this.y + 'px';
        this.el.style.opacity = this.opacity;
        if (this.life <= 0) {
            this.el.remove();
            return false;
        }
        return true;
    }
}

    function playSfx(type) {
        const osc = sfxCtx.createOscillator();
        const gain = sfxCtx.createGain();

        osc.connect(gain);
        gain.connect(sfxCtx.destination);

        if (type === 'correct') {
            osc.frequency.setValueAtTime(523.25, sfxCtx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(880, sfxCtx.currentTime + 0.1); // A5
        } else {
            osc.frequency.setValueAtTime(220, sfxCtx.currentTime); // A3
            osc.frequency.exponentialRampToValueAtTime(110, sfxCtx.currentTime + 0.2); // A2
        }

        gain.gain.setValueAtTime(0.1, sfxCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, sfxCtx.currentTime + 0.3);

        osc.start();
       osc.stop(sfxCtx.currentTime + 0.3);
   }
   
   function spawnCorrectParticles(x, y) {
       for (let i = 0; i < 8; i++) {
           const p = document.createElement('div');
           p.className = 'star-particle';
           p.innerText = ['✨', '⭐', '🌸', '💖'][Math.floor(Math.random() * 4)];
           p.style.left = x + 'px';
           p.style.top = y + 'px';
           p.style.animation = `starFall ${Math.random() * 1 + 0.5}s linear forwards`;
           document.body.appendChild(p);
           setTimeout(() => p.remove(), 1000);
       }
   }

   function playItemSound(key, item, level) {
       if (!item) return;
       
        let text = item.name;
        if (level === 2) {
            text = `Lyd: ${key}. ${item.name}`;
        } else if (level === 1) {
            text = `${key} er for ${item.name}`;
        } else {
            text = item.name;
        }
        speak(text);
   }

function speakPrompt() {
    const data = currentRoundItem;
    let audioText = currentItem;
    
    if (currentLevel === 1) {
        audioText = `Hvilken bokstav er dette? ${currentItem}`;
    } else if (currentLevel === 2) {
        // Gjør det mer utfordrende: ikke si hva lyden er i prompten, 
        // men be brukeren lytte etter lyden i ordet som følger.
        audioText = `Hvilken lyd starter dette ordet med? ... ${data.name}`;
    } else {
        audioText = `Hvilket ord er dette? ${currentItem}`;
    }

    if (isZenMode) {
        audioText += ` . . . Det er ${currentItem}`;
    }
    
    speak(audioText);
}

function nextRound() {
    resultDiv.innerText = '';
    nameDiv.innerText = '';
    letterGrid.innerHTML = '';
    
    if (!levelData[currentLevel]) {
        currentLevel = 1;
    }

    const pool = levelData[currentLevel].items;
    const keys = Object.keys(pool);
    
    let newItem = keys[0];
    if (keys.length > 1) {
        do {
            newItem = keys[Math.floor(Math.random() * keys.length)];
        } while (newItem === lastItem);
    }

    currentItem = newItem;
    lastItem = currentItem;

    // Pick a random item for this key
    const itemOptions = pool[currentItem];
    currentRoundItem = itemOptions[Math.floor(Math.random() * itemOptions.length)];
    
    let numOptions = 3;
    if (currentLevel === 2) numOptions = 4;
    if (currentLevel === 3) numOptions = 6;
    
    let options = [currentItem];
    const maxOptions = Math.min(numOptions, keys.length);
    
    while(options.length < maxOptions) {
        let randomK = keys[Math.floor(Math.random() * keys.length)];
        if(!options.includes(randomK)) options.push(randomK);
    }
    
    options.sort(() => Math.random() - 0.5);

   options.forEach(k => {
       const btn = document.createElement('button');
       btn.className = 'letter-btn';
       btn.innerText = k;
        
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9FF3', '#A29BFE', '#55E6C1'];
        btn.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        btn.style.boxShadow = `0 8px 0 ${colors[Math.floor(Math.random() * colors.length)]}`;

       btn.onclick = () => checkAnswer(k, btn);
       letterGrid.appendChild(btn);
   });

    setTimeout(speakPrompt, 500);
}

function checkAnswer(letter, btn) {
    if (isProcessing) return;

   if(letter === currentItem) {
           btn.classList.add('correct');
           const rect = btn.getBoundingClientRect();
           spawnCorrectParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
           floatingTexts.push(new FloatingText(rect.left + rect.width / 2, rect.top, 'Súper!', '#ff69b4'));

           streak++;
           
           if (streak >= 10) {
               const perfect = document.createElement('div');
               perfect.className = 'perfect-text';
               perfect.innerText = 'PERFEKT! ✨';
               document.body.appendChild(perfect);
               setTimeout(() => perfect.remove(), 600);
           }
           
           if (streak > 1) {
           if (streak >= 5) {
               activateFeverMode();
           }
            if (streak > 0 && streak % 10 === 0) {
                triggerBonusRound();
            }
           createComboPopup(btn);
           }
           
           playSfx('correct');
           
           totalStars++;
        localStorage.setItem('bokstavspillStars', totalStars);
        const item = currentRoundItem;
        resultDiv.innerText = item.emoji;

            const unlockId = `${currentItem}_${item.name}`;
            if (!unlockedItems.includes(unlockId)) {
                unlockedItems.push(unlockId);
                localStorage.setItem('bokstavspillUnlocked', JSON.stringify(unlockedItems));
            }
            resultDiv.classList.add('pop-in');
            let successText = '';
            if (currentLevel === 1) {
                successText = `${currentItem} er for ${item.name}!`;
            } else if (currentLevel === 2) {
                successText = `${item.name} begynner med lyden ${currentItem}!`;
            } else {
                successText = `Det er ${item.name}!`;
            }
            const feedback = ellieFeedback.correct[Math.floor(Math.random() * ellieFeedback.correct.length)];
            nameDiv.innerText = `${feedback} ${successText}`;
            speak(`${feedback} ${successText}`);
        
        updateStatus();
        
        const pool = levelData[currentLevel].items;
        const unlockedInLevel = Object.keys(pool).filter(k => {
            return pool[k].some(item => unlockedItems.includes(`${k}_${item.name}`));
        }).length;

        if(streak >= 5 && unlockedInLevel >= 10 && currentLevel < 3) {
            levelUp();
        }

        isProcessing = true;
        setTimeout(() => {
            resultDiv.classList.remove('pop-in');
            isProcessing = false;
            nextRound();
        }, 3000);
   } else {
       btn.classList.add('wrong');
        playSfx('wrong');
       const container = document.getElementById('game-container');
       container.classList.add('shake');
       setTimeout(() => container.classList.remove('shake'), 500);
        
        streak = 0;
        updateStatus();
        const feedback = ellieFeedback.wrong[Math.floor(Math.random() * ellieFeedback.wrong.length)];
        speak(feedback);
        
        document.getElementById('game-container')?.classList.remove('fever-mode');
        
        if (bestStreak > 0) {
            // Just for internal tracking, we don't reset bestStreak on wrong answer.
        }
        
        setTimeout(() => btn.classList.remove('wrong'), 500);
    }
}

function createComboPopup(element) {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.innerText = streak + ' 🔥';
    popup.style.left = element.offsetLeft + 'px';
    popup.style.top = element.offsetTop + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

function activateFeverMode() {
    const container = document.getElementById('game-container');
    if (container) {
        container.classList.add('fever-mode');
    }
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.className = 'star-particle';
            star.innerText = '⭐';
            star.style.left = Math.random() * 100 + 'vw';
            star.style.top = '-20px';
            star.style.fontSize = Math.random() * 20 + 10 + 'px';
            star.style.animationDuration = Math.random() * 2 + 1 + 's';
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 2000);
        }, i * 150);
    }
}

function spawnStarParticles() {
    for (let i = 0; i < 12; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        star.innerText = '⭐';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = '-20px';
        star.style.fontSize = Math.random() * 20 + 10 + 'px';
        star.style.animationDuration = Math.random() * 2 + 1 + 's';
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 2000);
    }
}

function updateStatus() {
    levelText.innerText = `Nivå: ${currentLevel} (${levelData[currentLevel].name})`;
    streakText.innerText = `Streak: ${streak} 🔥`;
    if (streak > bestStreak) {
        bestStreak = streak;
        localStorage.setItem('bokstavspillBestStreak', bestStreak);
    }
    starsText.innerText = `Stjerner: ${totalStars} ⭐`;
    updateProgressBar();
    updateBadges();
}

function updateBadges() {
    badgesContainer.innerHTML = '';
    const badges = [];
    if (totalStars >= 10) badges.push('Stjerne-samler ⭐');
    if (totalStars >= 50) badges.push('Superstjerne 🌟');
    if (streak >= 10) badges.push('Streak-mester 🔥');
    if (currentLevel >= 2) badges.push('Lyd-utforsker 🎧');
    if (currentLevel >= 3) badges.push('Ord-ekspert 📚');
    if (bestStreak >= 20) badges.push('Uknuselig Streak 🏆');
    
    badges.forEach(b => {
        const span = document.createElement('span');
        span.className = 'badge';
        span.innerText = b;
        badgesContainer.appendChild(span);
    });
}
function createBackgroundBubbles() {
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bg-bubble';
        const size = Math.random() * 60 + 20 + 'px';
        bubble.style.width = size;
        bubble.style.height = size;
        bubble.style.left = Math.random() * 100 + 'vw';
        bubble.style.animationDuration = Math.random() * 10 + 5 + 's';
        document.body.appendChild(bubble);
    }
}

function endChallenge() {
        isProcessing = true;
        speak(`Tiden er ute! Du klarte ${streak} riktige på rad! Fantastisk innsats!`);
        if (streak > challengeHighScore) {
            challengeHighScore = streak;
            localStorage.setItem('bokstavspillChallengeHighScore', challengeHighScore);
        }
        
        const endScreen = document.getElementById('challenge-end-screen');
        const scoreText = document.getElementById('challenge-score');
        const bestText = document.getElementById('challenge-best');
        
        scoreText.innerText = `Poengsum: ${streak}`;
        bestText.innerText = `Beste: ${challengeHighScore}`;
        endScreen.style.display = 'flex';
        spawnConfetti();
    }
    highScoreDisplay.innerText = `Beste utfordring: ${challengeHighScore} 🔥`;

    function renderLevelButtons() {
    levelButtonsContainer.innerHTML = '';
    Object.entries(levelData).forEach(([levelStr, levelObj]) => {
        const level = parseInt(levelStr);
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.style.width = '300px';
        btn.style.backgroundColor = ['#FF6B6B', '#4ECDC4', '#FFE66D'][level-1] || '#A29BFE';
        btn.style.boxShadow = `0 8px 0 #d81b60`;
        btn.innerText = `Nivå ${level}: ${levelObj.name}`;
        btn.onclick = () => {
            levelScreen.style.display = 'none';
            currentLevel = level;
            localStorage.setItem('bokstavspillLevel', currentLevel);
            createBackgroundBubbles();
            updateStatus();
            renderCollection();
            nextRound();
            document.getElementById('game-container').style.display = 'block';
        };
        levelButtonsContainer.appendChild(btn);
    });
}

backToStartBtn.onclick = () => {
    levelScreen.style.display = 'none';
    startScreen.style.display = 'flex';
};

function updateGameLoop() {
    floatingTexts = floatingTexts.filter(ft => ft.update());
    requestAnimationFrame(updateGameLoop);
}

updateGameLoop();

galleryBtn.onclick = () => {
    startScreen.style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    collectionOverlay.style.display = 'flex';
    renderCollection();
};

closeGalleryBtn.onclick = () => {
    collectionOverlay.style.display = 'none';
};

    homeBtn.onclick = () => {
        collectionOverlay.style.display = 'none';
    startScreen.style.display = 'flex';
    document.getElementById('game-container').style.display = 'none';
};

const explorerBtn = document.getElementById('explorer-btn');
const explorerOverlay = document.getElementById('explorer-overlay');
const closeExplorerBtn = document.getElementById('close-explorer-btn');
const explorerGrid = document.getElementById('explorer-grid');

explorerBtn.onclick = () => {
    startScreen.style.display = 'none';
    explorerOverlay.style.display = 'flex';
    renderExplorer();
};

closeExplorerBtn.onclick = () => {
    explorerOverlay.style.display = 'none';
};

function renderExplorer() {
    explorerGrid.innerHTML = '<div style="width:100%; text-align:center; font-weight:bold; margin-bottom:10px; color:#ff69b4;">Lyd-utforsker 🔍</div>';
    Object.entries(levelData[2].items).forEach(([key, items]) => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.innerText = key;
        btn.style.width = 'auto';
        btn.style.padding = '10px 20px';
        btn.onclick = () => {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            playItemSound(key, randomItem, 2);
        };
        explorerGrid.appendChild(btn);
    });
}

    zenModeCheckbox.onchange = () => {
        isZenMode = zenModeCheckbox.checked;
    };

    hintBtn.onclick = () => {
    const data = currentRoundItem;
    if (currentLevel === 1) {
        speak(`Det begynner på ${currentItem}`);
    } else if (currentLevel === 2) {
        speak(`Hør etter: ${data.audioHint || currentItem}`);
    } else {
        speak(`Ordet har ${currentItem.length} bokstaver`);
    }
};
