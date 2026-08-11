---
title: "D-Day: de geallieerde landing in Normandië"
date:
  year: 1944
  era: ce
  precision: day
  month: 6
  day: 6
summary: Op 6 juni 1944 begon met D-Day de bevrijding van West-Europa.
topics:
  - oorlog
  - europa
profiles:
  - auto-mechanica
sources:
  - title: D-Day
    publisher: United States Army
    url: https://www.army.mil/d-day/
  - title: How our weather advice influenced D-Day and Operation Overlord
    publisher: Met Office
    url: https://www.metoffice.gov.uk/research/library-and-archive/archive-hidden-treasures/d-day
beat:
  version: 1
  mechanic: context-decision
  perspective: Je adviseert de geallieerde leiding met de informatie van 5 juni 1944. Je beslist niet over de oorlog, alleen over het moment van de landing.
  question: Doorgaan op 6 juni of opnieuw uitstellen?
  choices:
    - id: proceed
      label: Doorgaan op 6 juni
    - id: postpone
      label: Opnieuw uitstellen
    - id: cancel
      label: De operatie stoppen
    - id: uncertain
      label: Meer weerdata nodig
  stages:
    - id: opening
      phase: opening
      suggestedSeconds: 20
      teacherPrompt: Lees de situatie zonder de historische beslissing te verklappen.
      expectedStudentAction: Bekijk de opties en de grens van het advies.
      stimulus: De landing van 5 juni is geschrapt door slecht weer. Voor 6 juni voorspelt het weerteam een kort venster met nog altijd matige omstandigheden. De vloot wacht; geheimhouding is niet onbeperkt.
    - id: commitment
      phase: commitment
      suggestedSeconds: 20
      teacherPrompt: Laat iedereen tegelijk een advies tonen.
      expectedStudentAction: Kies een advies.
      prompt: Wat adviseer je?
    - id: weather-evidence
      phase: evidence
      suggestedSeconds: 50
      teacherPrompt: Vraag wat een smal weerraam betekent voor beide opties.
      expectedStudentAction: Vergelijk het risico van doorgaan met dat van wachten.
      title: Een smal weerraam
      evidence: Meteoroloog James Stagg vond 5 juni te gevaarlijk. Voor 6 juni voorspelde zijn team een kort weerraam. De omstandigheden bleven marginaal, maar waren volgens het Met Office voldoende voor de landing.
      sourceUrl: https://www.metoffice.gov.uk/research/library-and-archive/archive-hidden-treasures/d-day
      earliestDurationMinutes: 5
    - id: first-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Laat partners elk het grootste risico van één optie noemen.
      expectedStudentAction: Verdedig één risico en bevraag het andere.
      prompt: "Welk risico is groter: slecht weer of opnieuw wachten?"
    - id: scale-evidence
      phase: evidence
      suggestedSeconds: 60
      teacherPrompt: Laat de schaal vertalen naar logistieke gevolgen van uitstel.
      expectedStudentAction: Koppel aantallen aan de beslissing.
      title: Geen kleine verplaatsing
      evidence: Bijna drie miljoen geallieerde militairen waren in Zuid-Engeland samengebracht. Voor D-Day stonden meer dan 5.000 schepen en 13.000 vliegtuigen klaar.
      sourceUrl: https://www.army.mil/d-day/
      earliestDurationMinutes: 8
      optional: true
    - id: second-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Vraag wat langer wachten met zo’n operatie kan doen.
      expectedStudentAction: Noem één logistiek of strategisch gevolg.
      prompt: Wat wordt moeilijker naarmate zo’n operatie langer stilstaat?
      optional: true
    - id: responsibility-evidence
      phase: evidence
      suggestedSeconds: 70
      teacherPrompt: Bespreek verantwoordelijkheid zonder van leiderschap heldendom te maken.
      expectedStudentAction: Leg uit wat de notitie over onzekerheid toont.
      title: Een notitie voor als het mislukt
      evidence: Eisenhower schreef vóór de landing een korte verklaring waarin hij alle schuld op zich nam als het bruggenhoofd zou mislukken. De beslissing bleef dus onzeker, ook voor de bevelhebber.
      sourceUrl: https://www.army.mil/d-day/
      earliestDurationMinutes: 12
      optional: true
    - id: third-discussion
      phase: discussion
      suggestedSeconds: 60
      teacherPrompt: Vraag wat verantwoordelijkheid wel en niet oplost.
      expectedStudentAction: Maak onderscheid tussen beslissen en zeker weten.
      prompt: Maakt verantwoordelijkheid een beslissing beter, of alleen zwaarder?
      optional: true
    - id: revision
      phase: revision
      suggestedSeconds: 30
      teacherPrompt: Laat iedereen opnieuw een advies tonen.
      expectedStudentAction: Kies opnieuw.
      prompt: Doorgaan of uitstellen?
    - id: reasoning
      phase: reasoning
      suggestedSeconds: 40
      teacherPrompt: Vraag welk risico de doorslag gaf.
      expectedStudentAction: Noem één concreet risico.
      prompt: Welk risico gaf voor jou de doorslag?
      optional: true
    - id: resolution
      phase: resolution
      suggestedSeconds: 60
      teacherPrompt: Vertel de beslissing, uitkomst en menselijke kost zonder triomftaal.
      expectedStudentAction: Vergelijk je advies met de historische beslissing.
      title: 6 juni 1944
      feedback: "Eisenhower liet de landing doorgaan tijdens het voorspelde weerraam. Bijna 160.000 geallieerde militairen landden en veroverden een bruggenhoofd. De prijs was hoog: meer dan 9.000 geallieerde militairen werden gedood of raakten gewond."
      misconception: D-Day besliste de oorlog niet op één dag. Het bruggenhoofd maakte de verdere bevrijding van West-Europa mogelijk.
      sourceUrls:
        - https://www.army.mil/d-day/
        - https://www.metoffice.gov.uk/research/library-and-archive/archive-hidden-treasures/d-day
    - id: lesson-bridge
      phase: lesson-bridge
      suggestedSeconds: 30
      teacherPrompt: Koppel de beslissing aan onzekerheid, data en logistiek.
      expectedStudentAction: Benoem de afweging tussen wachten en handelen.
      bridge: Hoe beslis je wanneer wachten én doorgaan gevaarlijk zijn?
  routes:
    - durationMinutes: 5
      stageIds:
        - opening
        - commitment
        - weather-evidence
        - first-discussion
        - revision
        - resolution
        - lesson-bridge
    - durationMinutes: 8
      stageIds:
        - opening
        - commitment
        - weather-evidence
        - first-discussion
        - scale-evidence
        - second-discussion
        - revision
        - reasoning
        - resolution
        - lesson-bridge
    - durationMinutes: 12
      stageIds:
        - opening
        - commitment
        - weather-evidence
        - first-discussion
        - scale-evidence
        - second-discussion
        - responsibility-evidence
        - third-discussion
        - revision
        - reasoning
        - resolution
        - lesson-bridge
  sensitivityNotes:
    - Behandel de beslissing als een afweging onder onzekerheid, niet als een kans om oorlog na te spelen.
    - Houd menselijke verliezen buiten humor, competitie en scoretaal.
---

Op 6 juni 1944 landden bijna 160.000 geallieerde militairen aan de kust van Normandië. De operatie opende een nieuw westelijk front tegen nazi-Duitsland.

## Vijf stranden

De landingszones kregen de codenamen Utah, Omaha, Gold, Juno en Sword. Schepen, vliegtuigen, voertuigen en tijdelijke havens maakten de enorme operatie mogelijk.

D-Day besliste de oorlog niet op één dag. De landing gaf de geallieerden wel een bruggenhoofd van waaruit zij Frankrijk verder konden bevrijden.
