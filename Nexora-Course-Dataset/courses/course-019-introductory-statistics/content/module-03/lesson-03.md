# 3.2 Independent and Mutually Exclusive Events

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/3-2-independent-and-mutually-exclusive-events
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.2 Independent and Mutually Exclusive Events

Independent and mutually exclusive do **not** mean the same thing.

### Independent Events

Two events are independent if the following are true:

  * _P_(_A_ |_B_) = _P_(_A_)
  * _P_(_B_ |_A_) = _P_(_B_)
  * _P_(_A_ AND _B_) = _P_(_A_)_P_(_B_)

Two events _A_ and _B_ are independent if the knowledge that one occurred does not affect the chance the other occurs. For example, the outcomes of two roles of a fair die are independent events. The outcome of the first roll does not change the probability for the outcome of the second roll. To show two events are independent, you must show **only one** of the above conditions. If two events are NOT independent, then we say that they are **dependent**.

Sampling may be done **with** replacement or **without replacement**.

  * **With replacement** : If each member of a population is replaced after it is picked, then that member has the possibility of being chosen more than once. When sampling is done with replacement, then events are considered to be independent, meaning the result of the first pick will not change the probabilities for the second pick.
  * **Without replacement** : When sampling is done without replacement, each member of a population may be chosen only once. In this case, the probabilities for the second pick are affected by the result of the first pick. The events are considered to be dependent or not independent.

If it is not known whether _A_ and _B_ are independent or dependent, **assume they are dependent until you can show otherwise**.

###  Example  3.4

You have a fair, well-shuffled deck of 52 cards. It consists of four suits. The suits are clubs, diamonds, hearts and spades. There are 13 cards in each suit consisting of 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, _J_ (jack), _Q_ (queen), _K_ (king) of that suit.

a. Sampling with replacement:   
Suppose you pick three cards with replacement. The first card you pick out of the 52 cards is the _Q_ of spades. You put this card back, reshuffle the cards and pick a second card from the 52-card deck. It is the ten of clubs. You put this card back, reshuffle the cards and pick a third card from the 52-card deck. This time, the card is the _Q_ of spades again. Your picks are {_Q_ of spades, ten of clubs, _Q_ of spades}. You have picked the _Q_ of spades twice. You pick each card from the 52-card deck.

b. Sampling without replacement:   
Suppose you pick three cards without replacement. The first card you pick out of the 52 cards is the _K_ of hearts. You put this card aside and pick the second card from the 51 cards remaining in the deck. It is the three of diamonds. You put this card aside and pick the third card from the remaining 50 cards in the deck. The third card is the _J_ of spades. Your picks are {_K_ of hearts, three of diamonds, _J_ of spades}. Because you have picked the cards without replacement, you cannot pick the same card twice.

###  Try It  3.4

You have a fair, well-shuffled deck of 52 cards. It consists of four suits. The suits are clubs, diamonds, hearts and spades. There are 13 cards in each suit consisting of 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, _J_ (jack), _Q_ (queen), _K_ (king) of that suit. Three cards are picked at random.

  1. Suppose you know that the picked cards are _Q_ of spades, _K_ of hearts and _Q_ of spades. Can you decide if the sampling was with or without replacement?
  2. Suppose you know that the picked cards are _Q_ of spades, _K_ of hearts, and _J_ of spades. Can you decide if the sampling was with or without replacement?

###  Example  3.5

####  Problem

You have a fair, well-shuffled deck of 52 cards. It consists of four suits. The suits are clubs, diamonds, hearts, and spades. There are 13 cards in each suit consisting of 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, _J_ (jack), _Q_ (queen), and _K_ (king) of that suit. _S_ = spades, _H_ = Hearts, _D_ = Diamonds, _C_ = Clubs.

  1. Suppose you pick four cards, but do not put any cards back into the deck. Your cards are _QS_ , 1 _D_ , 1 _C_ , _QD_.
  2. Suppose you pick four cards and put each card back before you pick the next card. Your cards are _KH_ , 7 _D_ , 6 _D_ , _KH_.

Which of a. or b. did you sample with replacement and which did you sample without replacement?

####  Solution

a. Without replacement; b. With replacement

###  Try It  3.5

You have a fair, well-shuffled deck of 52 cards. It consists of four suits. The suits are clubs, diamonds, hearts, and spades. There are 13 cards in each suit consisting of 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, _J_ (jack), _Q_ (queen), and _K_ (king) of that suit. _S_ = spades, _H_ = Hearts, _D_ = Diamonds, _C_ = Clubs. Suppose that you sample four cards without replacement. Which of the following outcomes are possible? Answer the same question for sampling with replacement.

  1. _QS_ , 1 _D_ , 1 _C_ , _QD_
  2. _KH_ , 7 _D_ , 6 _D_ , _KH_
  3. _QS_ , 7 _D_ , 6 _D_ , _KS_

### Mutually Exclusive Events

_A_ and _B_ are mutually exclusive events if they cannot occur at the same time. This means that _A_ and _B_ do not share any outcomes and _P_(_A_ AND _B_) = 0.

For example, suppose the sample space _S_ = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}. Let _A_ = {1, 2, 3, 4, 5}, _B_ = {4, 5, 6, 7, 8}, and _C_ = {7, 9}. _A_ AND _B_ = {4, 5}. _P_(_A_ AND _B_) = 210210 and is not equal to zero. Therefore, _A_ and _B_ are not mutually exclusive. _A_ and _C_ do not have any numbers in common so _P_(_A_ AND _C_) = 0. Therefore, _A_ and _C_ are mutually exclusive.

If it is not known whether _A_ and _B_ are mutually exclusive, **assume they are not until you can show otherwise**. The following examples illustrate these definitions and terms.

###  Example  3.6

Flip two fair coins. (This is an experiment.)

The sample space is {_HH_ , _HT_ , _TH_ , _TT_} where _T_ = tails and _H_ = heads. The outcomes are _HH_ , _HT_ , _TH_ , and _TT_. The outcomes HT and TH are different. The _HT_ means that the first coin showed heads and the second coin showed tails. The _TH_ means that the first coin showed tails and the second coin showed heads.

  * Let _A_ = the event of getting **at most one tail**. (At most one tail means zero or one tail.) Then _A_ can be written as {_HH_ , _HT_ , _TH_}. The outcome _HH_ shows zero tails. _HT_ and _TH_ each show one tail.
  * Let _B_ = the event of getting all tails. _B_ can be written as {_TT_}. _B_ is the **complement** of _A_ , so _B_ = _A′_. Also, _P_(_A_) + _P_(_B_) = _P_(_A_) + _P_(_A′_) = 1.
  * The probabilities for _A_ and for _B_ are _P_(_A_) = 3434 and _P_(_B_) = 1414.
  * Let _C_ = the event of getting all heads. _C_ = {_HH_}. Since _B_ = {_TT_}, _P_(_B_ AND _C_) = 0. _B_ and _C_ are mutually exclusive. (_B_ and _C_ have no members in common because you cannot have all tails and all heads at the same time.)
  * Let _D_ = event of getting **more than one** tail. _D_ = {_TT_}. _P_(_D_) =  1 4 1 4
  * Let _E_ = event of getting a head on the first roll. (This implies you can get either a head or tail on the second roll.) _E_ = {_HT_ , _HH_}. _P_(_E_) =  2 4 2 4
  * Find the probability of getting **at least one** (one or two) tail in two flips. Let _F_ = event of getting at least one tail in two flips. _F_ = {_HT_ , _TH_ , _TT_}. _P_(_F_) =  3 4 3 4

###  Try It  3.6

Draw two cards from a standard 52-card deck with replacement. Find the probability of getting at least one black card.

###  Example  3.7

####  Problem

Flip two fair coins. Find the probabilities of the events.

  1. Let _F_ = the event of getting at most one tail (zero or one tail).
  2. Let _G_ = the event of getting two faces that are the same.
  3. Let _H_ = the event of getting a head on the first flip followed by a head or tail on the second flip.
  4. Are _F_ and _G_ mutually exclusive?
  5. Let _J_ = the event of getting all tails. Are _J_ and _H_ mutually exclusive?

####  Solution

Look at the sample space in [Example 3.6](<3-2-independent-and-mutually-exclusive-events#element-931>).

  1. Zero (0) or one (1) tails occur when the outcomes _HH_ , _TH_ , _HT_ show up. _P_(_F_) =  3 4 3 4
  2. Two faces are the same if _HH_ or _TT_ show up. _P_(_G_) = 2424
  3. A head on the first flip followed by a head or tail on the second flip occurs when _HH_ or _HT_ show up. _P_(_H_) = 2424
  4. _F_ and _G_ share _HH_ so _P_(_F_ AND _G_) is not equal to zero (0). _F_ and _G_ are not mutually exclusive.
  5. Getting all tails occurs when tails shows up on both coins (_TT_). _H_ ’s outcomes are _HH_ and _HT_.

_J_ and _H_ have nothing in common so _P_(_J_ AND _H_) = 0. _J_ and _H_ are mutually exclusive.

###  Try It  3.7

A box has two balls, one white and one red. We select one ball, put it back in the box, and select a second ball (sampling with replacement). Find the probability of the following events:

  1. Let _F_ = the event of getting the white ball twice.
  2. Let _G_ = the event of getting two balls of different colors.
  3. Let _H_ = the event of getting white on the first pick.
  4. Are _F_ and _G_ mutually exclusive?
  5. Are _G_ and _H_ mutually exclusive?

###  Example  3.8

Roll one fair, six-sided die. The sample space is {1, 2, 3, 4, 5, 6}. Let event _A_ = a face is odd. Then _A_ = {1, 3, 5}. Let event _B_ = a face is even. Then _B_ = {2, 4, 6}.

  * Find the complement of _A_ , _A′_. The complement of _A_ , _A′_ , is _B_ because _A_ and _B_ together make up the sample space. _P_(_A_) + _P_(_B_) = _P_(_A_) + _P_(_A′_) = 1. Also, _P_(_A_) = 3636 and _P_(_B_) = 3636.
  * Let event _C_ = odd faces larger than two. Then _C_ = {3, 5}. Let event _D_ = all even faces smaller than five. Then _D_ = {2, 4}. _P_(_C_ AND _D_) = 0 because you cannot have an odd and even face at the same time. Therefore, _C_ and _D_ are mutually exclusive events.
  * Let event _E_ = all faces less than five. _E_ = {1, 2, 3, 4}.

####  Problem

Are _C_ and _E_ mutually exclusive events? (Answer yes or no.) Why or why not?

####  Solution

No. _C_ = {3, 5} and _E_ = {1, 2, 3, 4}. _P_(_C_ AND _E_) = 1616. To be mutually exclusive, _P_(_C_ AND _E_) must be zero.

  * Find _P_(_C_ |_A_). This is a conditional probability. Recall that the event _C_ is {3, 5} and event _A_ is {1, 3, 5}. To find _P_(_C_ |_A_), find the probability of _C_ using the sample space _A_. You have reduced the sample space from the original sample space {1, 2, 3, 4, 5, 6} to {1, 3, 5}. So, _P_(_C_ |_A_) =  2 3 2 3 . 

###  Try It  3.8

Let event _A_ = learning Spanish. Let event _B_ = learning German. Then _A_ AND _B_ = learning Spanish and German. Suppose _P_(_A_) = 0.4 and _P_(_B_) = 0.2. _P_(_A_ AND _B_) = 0.08. Are events _A_ and _B_ independent? Hint: You must show ONE of the following:

  * _P_(_A_ |_B_) = _P_(_A_)
  * _P_(_B_ |_A_) = _P_(_B_)
  * _P_(_A_ AND _B_) = _P_(_A_)_P_(_B_)

###  Example  3.9

Let event _G_ = taking a math class. Let event _H_ = taking a science class. Then, _G_ AND _H_ = taking a math class and a science class. Suppose _P_(_G_) = 0.6, _P_(_H_) = 0.5, and _P_(_G_ AND _H_) = 0.3. Are _G_ and _H_ independent?

If _G_ and _H_ are independent, then you must show **ONE** of the following:

  * _P_(_G_ |_H_) = _P_(_G_)
  * _P_(_H_ |_G_) = _P_(_H_)
  * _P_(_G_ AND _H_) = _P_(_G_)_P_(_H_)

###  NOTE

**The choice you make depends on the information you have.** You could choose any of the methods here because you have the necessary information.

####  Problem

a. Show that _P_(_G_ |_H_) = _P_(_G_).

####  Solution

_P_(_G_ |_H_) =  P(G AND H) P(H) P(G AND H) P(H) =  0.3 0.5 0.3 0.5 = 0.6 = _P_(_G_)

####  Problem

b. Show _P_(_G_ AND _H_) = _P_(_G_)_P_(_H_).

####  Solution

_P_(_G_)_P_(_H_) = (0.6)(0.5) = 0.3 = _P_(_G_ AND _H_)

Since _G_ and _H_ are independent, knowing that a person is taking a science class does not change the chance that he or she is taking a math class. If the two events had not been independent (that is, they are dependent) then knowing that a person is taking a science class would change the chance he or she is taking math. For practice, show that _P_(_H_ |_G_) = _P_(_H_) to show that _G_ and _H_ are independent events.

###  Try It  3.9

In a bag, there are six red marbles and four green marbles. The red marbles are marked with the numbers 1, 2, 3, 4, 5, and 6. The green marbles are marked with the numbers 1, 2, 3, and 4.

  * _R_ = a red marble
  * _G_ = a green marble
  * _O_ = an odd-numbered marble
  * The sample space is _S_ = {_R_ 1, _R_ 2, _R_ 3, _R_ 4, _R_ 5, _R_ 6, _G_ 1, _G_ 2, _G_ 3, _G_ 4}.

_S_ has ten outcomes. What is _P_(_G_ AND _O_)?

###  Example  3.10

####  Problem

Let event _C_ = taking an English class. Let event _D_ = taking a speech class.

Suppose _P_(_C_) = 0.75, _P_(_D_) = 0.3, _P_(_C_ |_D_) = 0.75 and _P_(_C_ AND _D_) = 0.225.

Justify your answers to the following questions numerically.

  1. Are _C_ and _D_ independent?
  2. Are _C_ and _D_ mutually exclusive?
  3. What is _P_(_D_ |_C_)?

####  Solution

  1. Yes, because _P_(_C_ |_D_) = _P_(_C_).
  2. No, because _P_(_C_ AND _D_) is not equal to zero.
  3. _P_(_D_ |_C_) =  P(C AND D) P(C) P(C AND D) P(C) =  0.225 0.75 0.225 0.75 = 0.3

###  Try It  3.10

A student goes to the library. Let events _B_ = the student checks out a book and _D_ = the student checks out a DVD. Suppose that _P_(_B_) = 0.40, _P_(_D_) = 0.30 and _P_(_B_ AND _D_) = 0.20.

  1. Find _P_(_B_ |_D_).
  2. Find _P_(_D_ |_B_).
  3. Are _B_ and _D_ independent?
  4. Are _B_ and _D_ mutually exclusive?

###  Example  3.11

In a box there are three red cards and five blue cards. The red cards are marked with the numbers 1, 2, and 3, and the blue cards are marked with the numbers 1, 2, 3, 4, and 5. The cards are well-shuffled. You reach into the box (you cannot see into it) and draw one card.

Let _R_ = red card is drawn, _B_ = blue card is drawn, _E_ = even-numbered card is drawn.

The sample space _S_ = _R_ 1, _R_ 2, _R_ 3, _B_ 1, _B_ 2, _B_ 3, _B_ 4, _B_ 5\. _S_ has eight outcomes.

  * _P_(_R_) =  3 8 3 8 . _P_(_B_) =  5 8 5 8 . _P_(_R_ AND _B_) = 0. (You cannot draw one card that is both red and blue.)
  * _P_(_E_) =  3 8 3 8 . (There are three even-numbered cards, _R_ 2, _B_ 2, and _B_ 4.)
  * _P_(_E_ |_B_) =  2 5 2 5 . (There are five blue cards: _B_ 1, _B_ 2, _B_ 3, _B_ 4, and _B_ 5\. Out of the blue cards, there are two even cards; _B_ 2 and _B_ 4.)
  * _P_(_B_ |_E_) =  2 3 2 3 . (There are three even-numbered cards: _R_ 2, _B_ 2, and _B_ 4\. Out of the even-numbered cards, to are blue; _B_ 2 and _B_ 4.)
  * The events _R_ and _B_ are mutually exclusive because _P_(_R_ AND _B_) = 0.
  * Let _G_ = card with a number greater than 3. _G_ = {_B_ 4, _B_ 5}. _P_(_G_) =  2 8 2 8 . Let _H_ = blue card numbered between one and four, inclusive. _H_ = {_B_ 1, _B_ 2, _B_ 3, _B_ 4}. _P_(_G_ |_H_) =  1 4 1 4 . (The only card in _H_ that has a number greater than three is _B_ 4.) Since  2 8 2 8 =  1 4 1 4 , _P_(_G_) = _P_(_G_ |_H_), which means that _G_ and _H_ are independent.

###  Try It  3.11

In a basketball arena,

  * 70% of the fans are rooting for the home team.
  * 25% of the fans are wearing blue.
  * 20% of the fans are wearing blue and are rooting for the away team.
  * Of the fans rooting for the away team, 67% are wearing blue.

Let _A_ be the event that a fan is rooting for the away team.   
Let _B_ be the event that a fan is wearing blue.   
Are the events of rooting for the away team and wearing blue independent? Are they mutually exclusive?

###  Example  3.12

####  Problem

In a particular college class, 60% of the students are female. Fifty percent of all students in the class have long hair. Forty-five percent of the students are female and have long hair. Of the female students, 75% have long hair. Let _F_ be the event that a student is female. Let _L_ be the event that a student has long hair. One student is picked randomly. Are the events of being female and having long hair independent?

  * The following probabilities are given in this example:
  * _P_(_F_) = 0.60; _P_(_L_) = 0.50
  * _P_(_F_ AND _L_) = 0.45
  * _P_(_L_ |_F_) = 0.75

###  NOTE

**The choice you make depends on the information you have.** You could use the first or last condition on the list for this example. You do not know _P_(_F_ |_L_) yet, so you cannot use the second condition.

####  Solution

>Check whether _P_(_F_ AND _L_) = _P_(_F_)_P_(_L_). We are given that _P_(_F_ AND _L_) = 0.45, but _P_(_F_)_P_(_L_) = (0.60)(0.50) = 0.30. The events of being female and having long hair are not independent because _P_(_F_ AND _L_) does not equal _P_(_F_)_P_(_L_).

Check whether _P_(_L_ |_F_) equals _P_(_L_). We are given that _P_(_L_ |_F_) = 0.75, but _P_(_L_) = 0.50; they are not equal. The events of being female and having long hair are not independent.

The events of being female and having long hair are not independent; knowing that a student is female changes the probability that a student has long hair.

###  Try It  3.12

Mark is deciding which route to take to work. His choices are _I_ = the Interstate and _F_ = Fifth Street.

  * _P_(_I_) = 0.44 and _P_(_F_) = 0.56
  * _P_(_I_ AND _F_) = 0 because Mark will take only one route to work.

What is the probability of _P_(_I_ OR _F_)?

###  Example  3.13

####  Problem

  1. Toss one fair coin (the coin has two sides, _H_ and _T_). The outcomes are ________. Count the outcomes. There are ____ outcomes.
  2. Toss one fair, six-sided die (the die has 1, 2, 3, 4, 5 or 6 dots on a side). The outcomes are ________________. Count the outcomes. There are ___ outcomes.
  3. Multiply the two numbers of outcomes. The answer is _______.
  4. If you flip one fair coin and follow it with the toss of one fair, six-sided die, the answer in part c. is the number of outcomes (size of the sample space). What are the outcomes? (Hint: Two of the outcomes are _H_ 1 and _T_ 6.)
  5. Event _A_ = heads (_H_) on the coin followed by an even number (2, 4, 6) on the die.   
_A_ = {_________________}. Find _P_(_A_).
  6. Event _B_ = heads on the coin followed by a three on the die. _B_ = {________}. Find _P_(_B_).
  7. Are _A_ and _B_ mutually exclusive? (Hint: What is _P_(_A_ AND _B_)? If _P_(_A_ AND _B_) = 0, then _A_ and _B_ are mutually exclusive.)
  8. Are _A_ and _B_ independent? (Hint: Is _P_(_A_ AND _B_) = _P_(_A_)_P_(_B_)? If _P_(_A_ AND _B_) = _P_(_A_)_P_(_B_), then _A_ and _B_ are independent. If not, then they are dependent).

####  Solution

  1. _H_ and _T_ ; 2
  2. 1, 2, 3, 4, 5, 6; 6
  3. 2(6) = 12
  4. _T_ 1, _T_ 2, _T_ 3, _T_ 4, _T_ 5, _T_ 6, _H_ 1, _H_ 2, _H_ 3, _H_ 4, _H_ 5, _H_ 6
  5. _A_ = {_H_ 2, _H_ 4, _H_ 6}; _P_(_A_) =  3 12 3 12
  6. _B_ = {_H_ 3}; _P_(_B_) =  1 12 1 12
  7. Yes, because _P_(_A_ AND _B_) = 0
  8. _P_(_A_ AND _B_) = 0._P_(_A_)_P_(_B_) =  ( 3 12 ) ( 3 12 ) ( 1 12 ) ( 1 12 ) . _P_(_A_ AND _B_) does not equal _P_(_A_)_P_(_B_), so _A_ and _B_ are dependent.

###  Try It  3.13

A box has two balls, one white and one red. We select one ball, put it back in the box, and select a second ball (sampling with replacement). Let _T_ be the event of getting the white ball twice, _F_ the event of picking the white ball first, _S_ the event of picking the white ball in the second drawing.

  1. Compute _P_(_T_).
  2. Compute _P_(_T_ |_F_).
  3. Are _T_ and _F_ independent?.
  4. Are _F_ and _S_ mutually exclusive?
  5. Are _F_ and _S_ independent?

