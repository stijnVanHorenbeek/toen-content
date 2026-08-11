---
title: Constantinopel valt
date:
  year: 1453
  era: ce
  precision: day
  month: 5
  day: 29
summary: Ottomaanse troepen nemen Constantinopel in.
topics:
  - politiek
  - oorlog
profiles:
  - algemeen
sources:
  - title: Fall of Constantinople
    publisher: Encyclopaedia Britannica
    url: https://www.britannica.com/event/Fall-of-Constantinople-1453
beat:
  version: 1
  mechanic: vote-revote
  question: Wat gaf de doorslag bij de val van Constantinopel?
  choices:
    - id: artillery
      label: De kanonnen
    - id: army
      label: De grotere troepenmacht
    - id: blockade
      label: De blokkade
    - id: combination
      label: De combinatie
  stages:
    - id: opening
      phase: opening
      suggestedSeconds: 20
      teacherPrompt: Lees de situatie. Geef nog geen cijfers.
      expectedStudentAction: Bekijk de mogelijke oorzaken.
      stimulus: Constantinopel heeft sterke muren. Mehmed II brengt een enorm leger, een vloot en zwaar geschut mee. Subtiliteit was duidelijk niet het plan.
    - id: commitment
      phase: commitment
      suggestedSeconds: 20
      teacherPrompt: Laat iedereen tegelijk een oorzaak tonen.
      expectedStudentAction: Kies een hoofdoorzaak.
      prompt: Eén oorzaak of de combinatie?
    - id: artillery-evidence
      phase: evidence
      suggestedSeconds: 50
      teacherPrompt: Vraag wat artillerie aan de verdediging veranderde.
      expectedStudentAction: Leg uit wat kanonnen wel en niet konden.
      title: 69 kanonnen
      evidence: Britannica beschrijft ongeveer 69 Ottomaanse kanonnen. Zware beschietingen beschadigden de landmuren tijdens het beleg.
      sourceUrl: https://www.britannica.com/event/Fall-of-Constantinople-1453
      earliestDurationMinutes: 5
    - id: first-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Laat partners de grens van een technologisch antwoord zoeken.
      expectedStudentAction: Benoem wat naast artillerie nodig bleef.
      prompt: Kan artillerie alleen een stad innemen?
    - id: numbers-evidence
      phase: evidence
      suggestedSeconds: 60
      teacherPrompt: Vergelijk de geschatte troepensterkte zonder schijnprecisie.
      expectedStudentAction: Koppel overmacht aan het lange beleg.
      title: Een ongelijke strijd
      evidence: Britannica schat de Ottomaanse troepenmacht op 60.000 tot 80.000. Aan Byzantijnse kant waren er naar schatting 6.000 tot 7.000 soldaten, naast bewapende burgers.
      sourceUrl: https://www.britannica.com/event/Fall-of-Constantinople-1453
      earliestDurationMinutes: 8
      optional: true
    - id: second-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Vraag wat een groter leger toevoegt aan zwaar geschut.
      expectedStudentAction: Vergelijk technologie met mankracht.
      prompt: Wat kan een groter leger doen wat een kanon niet kan?
      optional: true
    - id: blockade-evidence
      phase: evidence
      suggestedSeconds: 70
      teacherPrompt: Voeg bevoorrading en hulp toe aan het oorzakenmodel.
      expectedStudentAction: Leg het gevolg van omsingeling uit.
      title: Afgesloten over land en zee
      evidence: Mehmed II liet Constantinopel over land en zee blokkeren. De stad moest daardoor tegelijk muren verdedigen, bevoorrading volhouden en op meerdere fronten reageren.
      sourceUrl: https://www.britannica.com/event/Fall-of-Constantinople-1453
      earliestDurationMinutes: 12
      optional: true
    - id: third-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Vraag hoe de blokkade de andere oorzaken versterkte.
      expectedStudentAction: Verbind minstens twee oorzaken.
      prompt: Hoe maakt een blokkade kanonnen en overmacht gevaarlijker?
      optional: true
    - id: revision
      phase: revision
      suggestedSeconds: 30
      teacherPrompt: Laat iedereen opnieuw een oorzaak tonen.
      expectedStudentAction: Kies opnieuw.
      prompt: Nog steeds dezelfde oorzaak?
    - id: reasoning
      phase: reasoning
      suggestedSeconds: 40
      teacherPrompt: Vraag welk detail het oordeel veranderde.
      expectedStudentAction: Noem één cijfer of verband.
      prompt: Welk detail veranderde je antwoord?
      optional: true
    - id: resolution
      phase: resolution
      suggestedSeconds: 60
      teacherPrompt: Leg uit hoe technologie, mankracht en blokkade samenwerkten.
      expectedStudentAction: Controleer of je antwoord meerdere oorzaken verbindt.
      title: Geen wonderwapen
      feedback: De kanonnen beschadigden de muren, maar ze werkten niet alleen. De grotere troepenmacht hield de druk vol en de blokkade beperkte hulp en bevoorrading. De combinatie gaf de doorslag.
      misconception: De kanonnen waren belangrijk, maar brachten geen automatische overwinning. Het beleg duurde 55 dagen.
      sourceUrls:
        - https://www.britannica.com/event/Fall-of-Constantinople-1453
    - id: lesson-bridge
      phase: lesson-bridge
      suggestedSeconds: 30
      teacherPrompt: Koppel de gebeurtenis aan meer-causale historische uitleg.
      expectedStudentAction: Leg uit waarom één oorzaak niet volstaat.
      bridge: Waarom klinkt één spectaculaire oorzaak vaak beter dan het hele antwoord?
  routes:
    - durationMinutes: 5
      stageIds:
        - opening
        - commitment
        - artillery-evidence
        - first-discussion
        - revision
        - resolution
        - lesson-bridge
    - durationMinutes: 8
      stageIds:
        - opening
        - commitment
        - artillery-evidence
        - first-discussion
        - numbers-evidence
        - second-discussion
        - revision
        - reasoning
        - resolution
        - lesson-bridge
    - durationMinutes: 12
      stageIds:
        - opening
        - commitment
        - artillery-evidence
        - first-discussion
        - numbers-evidence
        - second-discussion
        - blockade-evidence
        - third-discussion
        - revision
        - reasoning
        - resolution
        - lesson-bridge
  sensitivityNotes:
    - Troepenaantallen zijn historische schattingen. Presenteer ze niet als exact gemeten cijfers.
    - Maak van beleg, plundering of slachtoffers geen strategiespel.
---

De stad werd na een beleg ingenomen.
