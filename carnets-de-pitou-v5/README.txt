LES CARNETS DE PITOU — V3

UTILISATION
1. Décompresser le dossier.
2. Double-cliquer sur index.html.
3. Aucun serveur, compte ou installation n'est nécessaire pour afficher l'accueil.

NOUVEAUTÉS V3
- Image canon intégrée au fond et au bandeau d'accueil.
- Ossature des rubriques de l'ancien e-monsite conservée.
- Archives dynamiques par année/mois lorsque la date est connue.
- Zone "Sans date" pour ne rien inventer.
- Recherche et filtrage par rubrique.
- Navigation texte précédent / suivant.
- Lecture sur papier vieilli.
- Affichage responsive téléphone / ordinateur.

AJOUT D'UN TEXTE
La bibliothèque est pilotée par data.js et le dossier texts/.
Pour le moment, la méthode la plus sûre est de dupliquer une entrée existante dans data.js
et une page existante dans texts/. Une interface d'ajout pourra être construite ensuite.

IMPORTANT
Les dates non connues n'ont volontairement pas été inventées.


V4 — EDITEUR
- Ouvrir index.html puis cliquer sur "Éditeur".
- Mise en forme : gras, italique, souligné, barré, titres, citations, listes,
  alignement, police, taille, liens et séparateurs.
- Aperçu intégré dans le thème des Carnets.
- Les brouillons peuvent être conservés dans le navigateur (localStorage).
- "Exporter l'article" produit un fichier HTML autonome.

LIMITE TECHNIQUE IMPORTANTE
Un site ouvert directement par index.html n'a pas le droit de modifier silencieusement
les autres fichiers de ton ordinateur. L'éditeur peut donc sauvegarder des brouillons
dans le navigateur et exporter un article, mais pas injecter automatiquement ce fichier
dans la bibliothèque locale sans une étape supplémentaire.


V5 — PUBLICATION LOCALE
- Le bouton "Publier dans les Carnets" ajoute immédiatement le texte à la bibliothèque,
  à la recherche, à sa rubrique et aux archives.
- Les articles publiés ainsi sont stockés dans le navigateur utilisé sur cet ordinateur.
- "Sauvegarder ma bibliothèque" exporte articles locaux + brouillons dans un fichier JSON.
- "Restaurer une sauvegarde" permet de les récupérer.
- Pour modifier un article local, recharge son brouillon, conserve le même titre puis republie :
  l'éditeur proposera de remplacer l'article existant.

IMPORTANT POUR LA FUTURE MISE EN LIGNE
Cette publication est locale. Elle permet de tester et d'alimenter le site sans serveur.
Lors de la mise en ligne, on branchera le même éditeur sur le dépôt/hébergement afin que
"Publier" mette réellement à jour le site public.
