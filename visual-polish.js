(()=>{
const YEARS={
"La rédemption sur Althéa ~~ The Four Coming (T4C)":"2000",
"Ma Croisade.. ~~ Prophecy, Ultima Online":"2003",
"Découvrir le monde ~~ Lineage 2, Hypérion":"2002",
"Les Sentiers de la Foi ~~ World of Warcraft":"2007",
"Les Sentiers de la Solitude ~~ Age of Conan":"2008",
"Les Sentiers de la Spiritualité ~~ Lineage 2, Hérésie":"2007",
"Les Sentiers de la Vie ~~ World of Warcraft, Sentinelles":"2010",
"Les Chemins de la Paternité ~~ Tera":"2011",
"Les Sentiers du Salut ~~ Rift":"2012",
"Itinéraire d'un enfant de putain ~~ Black Desert Online":"2014",
"Magie, collocation et petites emmerdes ~~ Black Desert Online":"2017"
};
const cards=document.getElementById('cards'),article=document.getElementById('article');
function decorateCards(){if(!cards)return;cards.querySelectorAll('.subcategory-card').forEach(card=>{if(card.querySelector('.vestige-year'))return;let cat=card.dataset.subcat||'';if(!cat){const title=(card.querySelector('h3')?.textContent||'').trim();cat=Object.keys(YEARS).find(k=>k.split('~~')[0].trim().replace(/\.+$/,'')===title.replace(/\.+$/,''))||''}const year=YEARS[cat];if(!year)return;card.classList.add('has-vestige-year');const badge=document.createElement('span');badge.className='vestige-year';badge.textContent=year;badge.setAttribute('aria-label','Année '+year);card.appendChild(badge)})}
function decorateArticle(){if(!article)return;article.querySelectorAll('.pitou-dropcap').forEach(p=>p.classList.remove('pitou-dropcap'));const p=[...article.querySelectorAll('p')].find(x=>!x.classList.contains('subtitle')&&(x.textContent||'').trim().length>0);if(p)p.classList.add('pitou-dropcap')}
if(cards){new MutationObserver(decorateCards).observe(cards,{childList:true,subtree:true});decorateCards()}
if(article){new MutationObserver(decorateArticle).observe(article,{childList:true,subtree:true});decorateArticle()}
})();
