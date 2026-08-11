---
title: Het Voorlopig Bewind verklaart België onafhankelijk
date:
  year: 1830
  era: ce
  precision: day
  month: 10
  day: 4
summary: Op 4 oktober 1830 verklaarde het Voorlopig Bewind België onafhankelijk.
topics:
  - belgie
  - politiek
  - lokale-geschiedenis
profiles:
  - algemeen
sources:
  - title: The Rebellion
    publisher: Belgische federale overheid
    url: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/uprising
  - title: The Provisional Government and the National Congress
    publisher: Belgische federale overheid
    url: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/provisional_government_and_national_congress
  - title: The first, unitary constitution
    publisher: Belgische federale overheid
    url: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/first_unitary_constitution
beat:
  version: 1
  mechanic: source-duel
  question: Hoe democratisch was het nieuwe België?
  choices:
    - id: democratic
      label: Vrij democratisch
    - id: not-democratic
      label: Nauwelijks democratisch
    - id: mixed
      label: Rechten én uitsluiting
    - id: uncertain
      label: Nog te weinig info
  sourceCards:
    - id: rights-source
      label: Bron A · rechten
      excerpt: De grondwet maakte Belgen gelijk voor de wet en beschermde onder meer godsdienst, onderwijs, pers en vereniging.
      sourceUrl: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/first_unitary_constitution
    - id: voting-source
      label: Bron B · verkiezing
      excerpt: Alleen belastingbetalende bezitters mochten stemmen. Van de 45.000 stemgerechtigden brachten er 30.000 een stem uit.
      sourceUrl: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/provisional_government_and_national_congress
  stages:
    - id: opening
      phase: opening
      suggestedSeconds: 20
      teacherPrompt: Toon beide bronnen. Geef nog geen oordeel.
      expectedStudentAction: Lees beide bronkaarten.
      stimulus: In 1831 kreeg België een grondwet, een parlement en verkiezingen. Dat klinkt behoorlijk democratisch. Tot je de kleine lettertjes leest.
    - id: commitment
      phase: commitment
      suggestedSeconds: 20
      teacherPrompt: Laat iedereen tegelijk een oordeel tonen.
      expectedStudentAction: Kies een eerste oordeel.
      prompt: Wat is je oordeel?
    - id: constitution-evidence
      phase: evidence
      suggestedSeconds: 50
      teacherPrompt: Vraag welke rechten hier nieuw of belangrijk waren.
      expectedStudentAction: Haal één recht uit de bron.
      title: Veel rechten op papier
      evidence: De grondwet van 1831 voerde een scheiding der machten in en beschermde onder meer vrijheid van meningsuiting, godsdienst, onderwijs, pers en vereniging.
      sourceUrl: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/first_unitary_constitution
      earliestDurationMinutes: 5
    - id: first-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Laat partners nut en grens van bron A benoemen.
      expectedStudentAction: Noem wat bron A wel en niet bewijst.
      prompt: Welke conclusie kun je uit bron A trekken — en welke niet?
    - id: electorate-evidence
      phase: evidence
      suggestedSeconds: 60
      teacherPrompt: Laat het verschil tussen rechten en politieke macht benoemen.
      expectedStudentAction: Vergelijk rechten met stemrecht.
      title: Stemmen niet inbegrepen
      evidence: Voor het Nationaal Congres mochten alleen belastingbetalende bezitters stemmen. Slechts 45.000 Belgen waren stemgerechtigd; 30.000 brachten een stem uit.
      sourceUrl: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/provisional_government_and_national_congress
      earliestDurationMinutes: 8
      optional: true
    - id: second-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Vraag hoe beide bronnen tegelijk waar kunnen zijn.
      expectedStudentAction: Combineer de twee bronnen.
      prompt: Kan een land tegelijk vooruitstrevend en uitsluitend zijn?
      optional: true
    - id: social-evidence
      phase: evidence
      suggestedSeconds: 70
      teacherPrompt: Verbind de revolutie met de groep die later weinig politieke macht kreeg.
      expectedStudentAction: Vergelijk deelnemers aan de opstand met stemgerechtigden.
      title: Wie kwam in opstand?
      evidence: De federale overheid noemt de revolutie ook sociaal. Veel arbeiders waren werkloos, de oogst mislukte en voedsel werd schaars. Toch bleef het stemrecht daarna zeer beperkt.
      sourceUrl: https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/uprising
      earliestDurationMinutes: 12
      optional: true
    - id: third-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Vraag wie de revolutie droeg en wie daarna politieke macht kreeg.
      expectedStudentAction: Leg het verschil in één zin uit.
      prompt: Wie maakte de revolutie, en wie mocht daarna stemmen?
      optional: true
    - id: revision
      phase: revision
      suggestedSeconds: 30
      teacherPrompt: Laat iedereen opnieuw een oordeel tonen.
      expectedStudentAction: Kies opnieuw.
      prompt: En na beide bronnen?
    - id: reasoning
      phase: reasoning
      suggestedSeconds: 40
      teacherPrompt: Vraag om één detail uit elke bron.
      expectedStudentAction: Combineer twee concrete details.
      prompt: Welke twee details horen samen in een eerlijk antwoord?
      optional: true
    - id: resolution
      phase: resolution
      suggestedSeconds: 60
      teacherPrompt: Benoem tegelijk de nieuwe rechten en de beperkte politieke deelname.
      expectedStudentAction: Vergelijk je oordeel met beide bronnen.
      title: Rechten voor velen, macht voor enkelen
      feedback: België kreeg een grondwet met brede rechten en een parlementair systeem. Politieke deelname bleef klein omdat alleen belastingbetalende bezitters mochten stemmen. Het nieuwe land combineerde dus vooruitgang met uitsluiting.
      misconception: Beperkt stemrecht maakt de grondwet niet waardeloos. Het maakt het verhaal wel minder netjes.
      sourceUrls:
        - https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/provisional_government_and_national_congress
        - https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/first_unitary_constitution
        - https://www.belgium.be/en/about_belgium/country/history/belgium_from_1830/foundation_and_growth/uprising
    - id: lesson-bridge
      phase: lesson-bridge
      suggestedSeconds: 30
      teacherPrompt: Trek de vergelijking door naar andere politieke systemen.
      expectedStudentAction: Noem een criterium voor democratie.
      bridge: "Wanneer is een land democratisch: door zijn regels, zijn rechten of wie echt mag meedoen?"
  routes:
    - durationMinutes: 5
      stageIds:
        - opening
        - commitment
        - constitution-evidence
        - first-discussion
        - revision
        - resolution
        - lesson-bridge
    - durationMinutes: 8
      stageIds:
        - opening
        - commitment
        - constitution-evidence
        - first-discussion
        - electorate-evidence
        - second-discussion
        - revision
        - reasoning
        - resolution
        - lesson-bridge
    - durationMinutes: 12
      stageIds:
        - opening
        - commitment
        - constitution-evidence
        - first-discussion
        - electorate-evidence
        - second-discussion
        - social-evidence
        - third-discussion
        - revision
        - reasoning
        - resolution
        - lesson-bridge
  sensitivityNotes:
    - De bronkaarten zijn beknopte Nederlandstalige samenvattingen, geen letterlijke citaten.
    - Maak van beperkt stemrecht geen voetnoot; politieke uitsluiting is deel van het historische oordeel.
---

De zuidelijke provincies van het Verenigd Koninkrijk der Nederlanden kwamen in 1830 in opstand. Verschillen in taal, godsdienst en politieke macht speelden mee, maar ook hoge voedselprijzen en werkloosheid vergrootten de onvrede.

## Een staat in wording

Op 4 oktober verklaarde het Voorlopig Bewind de Belgische provincies onafhankelijk. Daarmee was het nieuwe land nog niet af: grenzen, een grondwet en een koning moesten nog worden geregeld.

De gebeurtenissen tonen hoe politieke conflicten en het dagelijkse leven elkaar beïnvloeden. Onvrede over bestuur wordt sterker wanneer mensen tegelijk problemen ervaren met werk en betaalbaar voedsel.
