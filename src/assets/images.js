import heroPizzaImg from './hero_pizza_1789589307504.jpg';
import veniceRialtoImg from './venice_rialto_1789589326527.jpg';
import catPizzaImg from './cat_pizza_1789589346371.jpg';
import catPastaImg from './cat_pasta_1789589362531.jpg';
import catDonerImg from './cat_doner_1789589379525.jpg';
import catSaladImg from './cat_salad_1789589396956.jpg';
import catSchnitzelImg from './cat_schnitzel_1789589414461.jpg';
const offerA1Img = '/images/Offer1.png';
const offerA2Img = '/images/Offer2.png';
const offerA3Img = '/images/offer3.png';
import varietyPizzaHeroImg from './variety_pizza_hero.png';
import cocktailDrinkImg from './cocktail_drink.png';
import greenLettuceImg from './green_lettuce.png';
import burgerAssembledImg from './burger_assembled.png';
const burgerHeroImg = burgerAssembledImg;
const burgerExplodedImg = burgerAssembledImg;

// User's custom pizza PNG images
import pizza1Img from './pizza 1.png';
import pizza2Img from './pizza 2.png';
import pizza3Img from './pizza 3.png';
import pizza4Img from './pizza 4.png';
import pizza5Img from './pizza 9.png';

import pastaSpecialImg from './pasta_special.jpg';
import burgerCrispyImg from './burger_crispy.jpg';
import tiramisuImg from './tiramisu_dessert.jpg';
import calzoneImg from './cat_calzone.jpg';

export const images = {
  heroPizza: heroPizzaImg,
  varietyPizzaHero: varietyPizzaHeroImg,
  cocktailDrink: cocktailDrinkImg,
  greenLettuce: greenLettuceImg,
  burgerHero: burgerHeroImg,
  burgerExploded: burgerExplodedImg,
  burgerAssembled: burgerAssembledImg,
  veniceRialto: veniceRialtoImg,
  categories: {
    all: heroPizzaImg,
    pizza: catPizzaImg,
    calzone: calzoneImg,
    pasta: catPastaImg,
    doner: catDonerImg,
    salad: catSaladImg,
    international: catSchnitzelImg,
    schnitzel: catSchnitzelImg,
    burger: burgerCrispyImg,
    dessert: tiramisuImg
  },
  offers: {
    a1: offerA1Img,
    a2: offerA2Img,
    a3: offerA3Img,
  },
  pizzas: {
    pizza1: pizza1Img,
    pizza2: pizza2Img,
    pizza3: pizza3Img,
    pizza4: pizza4Img,
    pizza5: pizza5Img,
    margherita: pizza1Img,
    salami: pizza2Img,
    prosciutto: pizza3Img,
    tonno: pizza4Img,
    special: pizza5Img
  },
  dishes: {
    pastaSpecial: pastaSpecialImg,
    burgerCrispy: burgerCrispyImg,
    tiramisu: tiramisuImg,
    schnitzel: catSchnitzelImg,
    doner: catDonerImg,
    salad: catSaladImg
  }
};
