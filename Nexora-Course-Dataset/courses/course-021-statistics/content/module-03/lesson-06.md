# 3.5 Tree and Venn Diagrams

> Source: Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/statistics/pages/3-5-tree-and-venn-diagrams
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.5 Tree and Venn Diagrams

Sometimes, when the probability problems are complex, it can be helpful to graph the situation. Tree diagrams and Venn diagrams are two tools that can be used to visualize and solve conditional probabilities.

### Tree Diagrams

A tree diagram is a special type of graph used to determine the outcomes of an experiment. It consists of _branches_ that are labeled with either frequencies or probabilities. Tree diagrams can make some probability problems easier to visualize and solve. The following example illustrates how to use a tree diagram:

###  Example  3.24

In an urn, there are 11 balls. Three balls are red (_R_) and eight balls are blue (_B_). Draw two balls, one at a time, **with replacement**. _With replacement_ means that you put the first ball back in the urn before you select the second ball. Therefore, you are selecting from exactly the same group each time, so each draw is independent. The tree diagram shows all the possible outcomes.

![This is a tree diagram with branches showing frequencies of each draw. The first branch shows two lines: 8B and 3R. The second branch has a set of two lines \(8B and 3R\) for each line of the first branch. Multiply along each line to find 64BB, 24BR, 24RB, and 9RR.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/14979036b70be20a0a5ea43a3e48c57e30d8620e) Figure  3.10 Total = 64 + 24 + 24 + 9 = 121.

The first set of branches represents the first draw. There are 8 ways to draw a blue marble and 3 ways to draw a red one. The second set of branches represents the second draw. Regardless of the choice on the first draw, there are again eight ways to draw a blue marble and 3 ways to draw a red one. Read down each branch to see the total number of possible outcomes. For example, there are 8 ways to get a blue marble on the first draw, and eight ways to get one on the second draw, so there are 8 × 8 = 64 different ways to draw two blue marbles in succession. Each of the outcomes is distinct. In fact, we can list each red ball as _R_ 1, _R_ 2, and _R_ 3 and each blue ball as _B_ 1, _B_ 2, _B_ 3, _B_ 4, _B_ 5, _B_ 6, _B_ 7, and _B_ 8\. Then the nine _RR_ outcomes can be written as follows:

_R_ 1 _R_ 1, _R_ 1 _R_ 2, _R_ 1 _R_ 3, _R_ 2 _R_ 1, _R_ 2 _R_ 2, _R_ 2 _R_ 3, _R_ 3 _R_ 1, _R_ 3 _R_ 2, _R_ 3 _R_ 3.

The other outcomes are similar.

There are a total of 11 balls in the urn. Draw two balls, one at a time, with replacement. There are 11(11) = 121 outcomes, the size of the sample space.  

####  Problem

a. List the 24 _BR_ outcomes: _B_ 1 _R_ 1, _B_ 1 _R_ 2, _B_ 1 _R_ 3, . . . 

####  Solution

a. We know that there will be 24 different possible outcomes because there are eight ways to draw blue and three ways to draw red. Make a systematic list of possible outcomes that consist of a blue marble on the first draw and a red marble on the second draw.  
  

_B_ 1 _R_ 1, _B_ 1 _R_ 2, _B_ 1 _R_ 3  
_B_ 2 _R_ 1, _B_ 2 _R_ 2, _B_ 2 _R_ 3  
_B_ 3 _R_ 1, _B_ 3 _R_ 2, _B_ 3 _R_ 3  
_B_ 4 _R_ 1, _B_ 4 _R_ 2, _B_ 4 _R_ 3  
_B_ 5 _R_ 1, _B_ 5 _R_ 2, _B_ 5 _R_ 3  
_B_ 6 _R_ 1, _B_ 6 _R_ 2, _B_ 6 _R_ 3  
_B_ 7 _R_ 1, _B_ 7 _R_ 2, _B_ 7 _R_ 3  
_B_ 8 _R_ 1, _B_ 8 _R_ 2, _B_ 8 _R_ 3  
  

####  Problem

b. Calculate _P_(_RR_).

####  Solution

b. You can use the tree diagram. There are nine ways to draw two reds and 121 possible outcomes. So, _P_(_RR_) =  9 121 . 9 121 . .

Each draw is independent, so you can also use the formula: _P_(_RR_) = _P_(_R_)_P_(_R_) =  ( 3 11 )( 3 11 ) ( 3 11 )( 3 11 ) =  9 121 . 9 121 .   
  

####  Problem

c. Calculate _P_(_RB_ OR _BR_).

####  Solution

c. The tree diagram shows that there are 24 ways to draw _RB_ and 24 ways to draw _BR_. There are 121 possible outcomes, so _P_(_RB_ or _BR_) =  24+24 121 = 48 121 24+24 121 = 48 121 .

The events _RB_ and _BR_ are mutually exclusive, so _P_(_RB_ OR _BR_) = _P_(_RB_) + _P_(_BR_) = _P_(_R_)_P_(_B_) + _P_(_B_)_P_(_R_) =  ( 3 11 )( 8 11 ) ( 3 11 )( 8 11 ) \+  ( 8 11 )( 3 11 ) ( 8 11 )( 3 11 ) =  48 121 . 48 121 .   
  

####  Problem

d. Using the tree diagram, calculate _P_(_R_ on 1st draw AND _B_ on 2nd draw).

####  Solution

d. Follow the path on the tree. There are three ways to get a red marble on the first draw and eight ways to get a blue on the second draw. There are 3 × 8 = 24 ways to draw red then blue, so _P_(_RB_) =  24 121 24 121 .

Can you think of another way to find this probability? _P_(_R_ on 1st draw AND _B_ on 2nd draw) = _P_(_RB_) =  ( 3 11 )( 8 11 ) ( 3 11 )( 8 11 ) =  24 121 24 121   
  

####  Problem

e. Using the tree diagram, calculate _P_(_R_ on 2nd draw GIVEN _B_ on 1st draw).

####  Solution

e. Given that a blue marble is selected first, we need only follow the left set of branches on the tree diagram. In this case, there are three ways to obtain red on the second draw and 11 possible outcomes.

![Image shows a tree diagram with two levels the first level shows two branches. The first level represents the first draw of a marble. The left branch is labeled eight B and the right branch is labeled three R. The second level represents the second draw, two additional branches extend from the end of first level’s branches. The left branch of each is labeled eight B and the right branch is labeled three R](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/590f30f8e07c6a7aa51dc70b7f4cad4d2f9073ff) Figure  3.11

P( R  on 2nd draw GIVEN B on 1st )=P( R on 2nd | B on 1st )= 3 11 P( R  on 2nd draw GIVEN B on 1st )=P( R on 2nd | B on 1st )= 3 11

You can also use the formula

P( R on 2nd | B on 1st )= P( R on 2nd AND B on 1st ) P( B on 1st ) = 24 121 64+24 121 = 24 88 = 3 11 . P( R on 2nd | B on 1st )= P( R on 2nd AND B on 1st ) P( B on 1st ) = 24 121 64+24 121 = 24 88 = 3 11 .

####  Problem

f. Using the tree diagram, calculate _P_(_BB_).

####  Solution

f. _P_(_BB_) =  64 121 64 121   
  

####  Problem

g. Using the tree diagram, calculate _P_(_B_ on the 2nd draw GIVEN _R_ on the first draw).

####  Solution

g. _P_(_B_ on 2nd draw|_R_ on 1st draw) =  8 11 8 11

There are 9 + 24 outcomes that have _R_ on the first draw (9 _RR_ and 24 _RB_). The sample space is then 9 + 24 = 33. Twenty-four of the 33 outcomes have _B_ on the second draw. The probability is then  24 33 24 33 .

###  Try It  3.24

In a standard deck, there are 52 cards. Twelve cards are face cards (event _F_) and 40 cards are not face cards (event _N_). Draw two cards, one at a time, with replacement. All possible outcomes are shown in the tree diagram as frequencies. Using the tree diagram, calculate _P_(_FF_).

![This is a tree diagram with branches showing frequencies of each draw. The first branch shows two lines: 12F and 40N. The second branch has a set of two lines \(12F and 40N\) for each line of the first branch. Multiply along each line to find 144FF, 480FN, 480NF, and 1,600NN.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/49785456144016a3634f73c2ac4f273c54ed6269) Figure  3.12

###  Example  3.25

An urn has three red marbles and eight blue marbles in it. Draw two marbles, one at a time, this time without replacement, from the urn. **_Without replacement_** means that you do not put the first ball back before you select the second marble. Following is a tree diagram for this situation. The branches are labeled with probabilities instead of frequencies. The numbers at the ends of the branches are calculated by multiplying the numbers on the two corresponding branches, for example, _P_(_RR_) =  ( 3 11 )( 2 10 )= 6 110 ( 3 11 )( 2 10 )= 6 110 .

![This is a tree diagram with branches showing probabilities of each draw. The first branch shows 2 lines: B 8/11 and R 3/11. The second branch has a set of 2 lines for each first branch line. Below B 8/11 are B 7/10 and R 3/10. Below R 3/11 are B 8/10 and R 2/10. Multiply along each line to find BB 56/110, BR 24/110, RB 24/110, and RR 6/110.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8cc48d36ad72e7343f7fed2711e514f1915fb1ef) Figure  3.13 Total =  56+24+24+6 110 = 110 110 =1 . 56+24+24+6 110 = 110 110 =1 .

###  NOTE

If you draw a red on the first draw from the three red possibilities, there are two red marbles left to draw on the second draw. You do not put back or replace the first marble after you have drawn it. You draw **without replacement** , so that on the second draw there are 10 marbles left in the urn.

  
Calculate the following probabilities using the tree diagram:  
  

####  Problem

a. _P_(_RR_) = ________

####  Solution

a. _P_(_RR_) =  ( 3 11 )( 2 10 )= 6 110 ( 3 11 )( 2 10 )= 6 110   
  

####  Problem

b. Fill in the blanks.

_P_(_RB_ OR _BR_) =  ( 3 11 )( 8 10 ) + (________)(________) = 48 110 ( 3 11 )( 8 10 ) + (________)(________) = 48 110

####  Solution

b. _P_(_RB_ OR _BR_) = _P_(_RB_) + _P_(_BR_) = _P_(_R_ on 1st) _P_(_B_ on 2nd) + _P_(_B_ on 1st) _P_(_R_ on 2nd) =  ( 3 11 )( 8 10 ) ( 3 11 )( 8 10 ) \+  ( 8 11 )( 3 10 ) ( 8 11 )( 3 10 ) =  48 110 48 110   

####  Problem

c. Because this is a conditional probability, we restrict the sample space to consider only those outcomes that have a blue marble in the first draw. Look at the second level of the tree to see that _P_(_R_ on 2nd|_B_ on 1st) =  3 10 3 10

####  Solution

c. _P_(_R_ on 2nd|_B_ on 1st) =  3 10 3 10   
  

####  Problem

d. Fill in the blanks.

_P_(_R_ on 1st AND _B_ on 2nd) = _P_(_RB_) = (________)(________) =  24 110 24 110

####  Solution

d. _P_(_R_ on 1st AND _B_ on 2nd) = _P_(_RB_) =  ( 3 11 )( 8 10 ) ( 3 11 )( 8 10 ) =  24 110 24 110   
  

####  Problem

e. Find _P_(_BB_).

####  Solution

e. _P_(_BB_) =  ( 8 11 )( 7 10 ) ( 8 11 )( 7 10 )   
  

####  Problem

f. Find _P_(_B_ on 2nd|_R_ on 1st).

####  Solution

f. Using the tree diagram, _P_(_B_ on 2nd|_R_ on 1st) = _P_(_R_ |_B_) =  8 10 8 10 .

If we are using probabilities, we can label the tree in the following general way:

![This is a tree diagram for a two-step experiment. The first branch shows first outcome: P\(B\) and P\(R\). The second branch has a set of 2 lines for each line of the first branch: the probability of B given B = P\(BB\), the probability of R given B = P\(RB\), the probability of B given R = P\(BR\), and the probability of R given R = P\(RR\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8c2e26f599358dbfa64f608792a9c2eebf478b2a)

  * _P_(_R_ |_R_) here means _P_(_R_ on 2nd|_R_ on 1st)
  * _P_(_B_ |_R_) here means _P_(_B_ on 2nd|_R_ on 1st)
  * _P_(_R_ |_B_) here means _P_(_R_ on 2nd|_B_ on 1st)
  * _P_(_B_ |_B_) here means _P_(_B_ on 2nd|_B_ on 1st)

###  Try It  3.25

In a standard deck, there are 52 cards. Twelve cards are face cards (_F_) and 40 cards are not face cards (_N_). Draw two cards, one at a time, without replacement. The tree diagram is labeled with all possible probabilities.

![This is a tree diagram with branches showing frequencies of each draw. The first branch shows 2 lines: F 12/52 and N 40/52. The second branch has a set of 2 lines \(F 11/52 and N 40/51\) for each line of the first branch. Multiply along each line to find FF 121/2652, FN 480/2652, NF 480/2652, and NN 1560/2652.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a147e103bb8e17ec60e8ff5d439614b3f7eae9d7) Figure  3.14

  1. Find _P_(_FN_ OR _NF_).
  2. Find _P_(_N_ |_F_).
  3. Find _P_(at most one face card).   
Hint: _At most one face card_ means zero or one face card.
  4. Find _P_(at least one face card).   
Hint: _At least one face card_ means one or two face cards.

###  Example  3.26

A litter of kittens available for adoption at the Humane Society has four tabby kittens and five black kittens. A family comes in and randomly selects two kittens (without replacement) for adoption.

![This is a tree diagram with branches showing probabilities of kitten choices. The first branch shows two lines: T 4/9 and B 5/9. The second branch has a set of 2 lines for each first branch line. Below T 4/9 are T 3/8 and B 5/8. Below B 5/9 are T 4/8 and B 4/8. Multiply along each line to find probabilities of possible combinations.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/501577bbb82c4847022a4b4da37bff2b8d81223d)

####  Problem

  1. Which shows the probability that both kittens are tabby?   
  
a.( 1 2 )( 1 2 ) a.( 1 2 )( 1 2 ) b.( 4 9 )( 4 9 ) b.( 4 9 )( 4 9 ) c.( 4 9 )( 3 8 ) c.( 4 9 )( 3 8 ) d.( 4 9 )( 5 9 ) d.( 4 9 )( 5 9 )
  2. What is the probability that one kitten of each coloring is selected?   
  
a.( 4 9 )( 5 9 ) a.( 4 9 )( 5 9 ) b.( 4 9 )( 5 8 ) b.( 4 9 )( 5 8 ) c.( 4 9 )( 5 9 )+( 5 9 )( 4 9 ) c.( 4 9 )( 5 9 )+( 5 9 )( 4 9 ) d.( 4 9 )( 5 8 )+( 5 9 )( 4 8 ) d.( 4 9 )( 5 8 )+( 5 9 )( 4 8 )
  3. What is the probability that a tabby is chosen as the second kitten when a black kitten was chosen as the first?
  4. What is the probability of choosing two kittens of the same color?

####  Solution

a.  ( 4 9 )( 3 8 ) ( 4 9 )( 3 8 ) , b.  ( 4 9 )( 5 8 )+( 5 9 )( 4 8 ) ( 4 9 )( 5 8 )+( 5 9 )( 4 8 ) , c.  4 8 4 8 , d.  32 72 32 72

###  Try It  3.26

Suppose there are four red balls and three yellow balls in a box. Three balls are drawn from the box without replacement. What is the probability that one ball of each coloring is selected?

### Venn Diagram

A Venn diagram is a picture that represents the outcomes of an experiment. It generally consists of a box that represents the sample space _S_ together with circles or ovals. The circles or ovals represent events.

###  Example  3.27

Suppose an experiment has the outcomes 1, 2, 3, . . . , 12 where each outcome has an equal chance of occurring. Let event _A_ = {1, 2, 3, 4, 5, 6} and event _B_ = {6, 7, 8, 9}. Then _A_ AND _B_ = {6} and _A_ OR  _B_ = {1, 2, 3, 4, 5, 6, 7, 8, 9}. The Venn diagram is as follows:

![Image shows a Venn diagram consisting of two overlapping ovals inside a rectangle. The left oval is labeled A and the right is labeled B. The rectangle is labeled S. Annotations explain that Every outcome in the sample space is listed in the box. The shaded, overlapping area contains any outcome that appears in both events. This area contains six. All outcomes in A are listed in the oval labeled A. The values one, two, three, four, and five lie inside A, but outside the overlapping region. All outcomes in B are listed in the oval labeled B. The values seven, eight, and nine lie inside B, but outside the overlapping region. The outcomes ten, eleven, and twelve are in the sample space, but not in the events A or B, so these are listed in the region inside the rectangle and outside the ovals.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/08eecefb2f128db10441c838f1e93b207cf05561) Figure  3.15

###  Try It  3.27

Suppose an experiment has outcomes black, white, red, orange, yellow, green, blue, and purple, where each outcome has an equal chance of occurring. Let event _C_ = {green, blue, purple} and event _P_ = {red, yellow, blue}. Then _C_ AND _P_ = {blue} and _C_ OR _P_ = {green, blue, purple, red, yellow}. Draw a Venn diagram representing this situation.

###  Example  3.28

Flip two fair coins. Let _A_ = tails on the first coin. Let _B_ = tails on the second coin. Then _A_ = {_TT_ , _TH_} and _B_ = {_TT_ , _HT_}. Therefore, _A_ AND _B_ = {_TT_}. _A_ OR _B_ = {_TH_ , _TT_ , _HT_}.

The sample space when you flip two fair coins is _X_ = {_HH_ , _HT_ , _TH_ , _TT_}. The outcome _HH_ is in NEITHER _A_ NOR _B_. The Venn diagram is as follows:

![This is a venn diagram. An oval representing set A contains Tails + Heads and Tails + Tails. An oval representing set B also contains Tails + Tails, along with Heads + Tails. The universe S contains Heads + Heads, but this value is not contained in either set A or B.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d44a80b3faf60efe368668024ed77f98ab32b38b) Figure  3.16

###  Try It  3.28

Roll a fair, six-sided die. Let _A_ = a prime number of dots is rolled. Let _B_ = an odd number of dots is rolled. Then _A_ = {2, 3, 5} and _B_ = {1, 3, 5}. Therefore, _A_ AND _B_ = {3, 5}. _A_ OR _B_ = {1, 2, 3, 5}. The sample space for rolling a fair die is _S_ = {1, 2, 3, 4, 5, 6}. Draw a Venn diagram representing this situation.

###  Example  3.29

####  Problem

**Forty percent** of the students at a local college belong to a club and **50 percent** work part time. **Five percent** of the students work part time and belong to a club. Draw a Venn diagram showing the relationships. Let _C_ = student belongs to a club and _PT_ = student works part time.

Start by drawing a rectangle to represent the sample space. Then draw two circles or ovals inside the rectangle to represent the events of interest: belonging to a club (_C_) and working part time (_PT_). Always draw overlapping shapes to represent outcomes that are in both events.

![Image shows a Venn diagram consisting of two overlapping circles inside a rectangle. The left oval is labeled C and the right is labeled PT. The rectangle is labeled S. The overlapping region is labeled C and PT and contains the probability five hundredths. The region inside C, but outside the overlapping region, contains the probability thirty-five hundredths. The region inside B, but outside the overlapping region, contains the probability forty-five hundredths. The probability fifteen hundredths is listed in the region inside the rectangle and outside the ovals.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/06af2f6bbf6fa2bd0ae8da6be45c4c3673e8ac25) Figure  3.17

Label each piece of the diagram clearly and note the probability or frequency of each part. Start by labeling the overlapping section first. Note that the probabilities in _C_ total 0.40 and the sum of the probabilities in _PT_ is 0.50. The total of all probabilities displayed must be 1, representing 100 percent of the sample space.

If a student is selected at random, find the following:

  1. the probability that the student belongs to a club.
  2. the probability that the student works part time.
  3. the probability that the student belongs to a club AND works part time.
  4. the probability that the student belongs to a club **given** that the student works part time.
  5. the probability that the student belongs to a club **OR** works part time. 

####  Solution

_P_(_C_) = .40

 _P_(_PT_) = .50

 _P_(_C_ AND _PT_) = .05

P(C|PT) = P(C AND PT) P(PT) = .05 .50 = .1 P(C|PT) = P(C AND PT) P(PT) = .05 .50 = .1

_P_(_C_ OR _PT_) = _P_(_C_) + _P_(_PT_) − _P_(_C_ AND _PT_) = .40 + .50 − .05 = .85

###  Try It  3.29

Fifty percent of the workers at a factory work a second job, 25 percent have a spouse who also works, and 5 percent work a second job and have a spouse who also works. Draw a Venn diagram showing the relationships. Let _W_ = works a second job and _S_ = spouse also works.

###  Example  3.30

####  Problem

A person with type O blood and a negative Rh factor (Rh–) can donate blood to any person with any blood type. Four percent of African Americans have type O blood and a negative Rh factor, 5−10 percent of African Americans have the Rh– factor, and 51 percent have type O blood.

![This is an empty Venn diagram showing two overlapping circles. The left circle is labeled O and the right circle is labeled RH-.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6358c71d71929c9e2a9e8b0ff23f34e5d54434e8) Figure  3.18

The “O” circle represents the African Americans with type O blood. The “Rh––" oval represents the African Americans with the Rh– –factor.

We will use the average of 5 percent and 10 percent, 7.5 percent, as the percentage of African Americans who have the Rh–– factor. Let _O_ = African American with Type O blood and _R_ = African American with Rh– –factor.

  1. _P_(_O_) = ___________
  2. _P_(_R_) = ___________
  3. _P_(_O_ AND _R_) = ___________
  4. _P_(_O_ OR _R_) = ____________
  5. In the Venn Diagram, describe the overlapping area using a complete sentence.
  6. In the Venn Diagram, describe the area in the rectangle but outside both the circle and the oval using a complete sentence.

####  Solution

a. _P_(_O_) = .51

b. _P_(_R_) = .075 because an average of 7.5 percent of African Americans have the Rh– –factor.

c. _P_(_O_ AND _R_) = 0.04 because 4 percent of African Americans have both Type O blood and the Rh– –factor.

d. _P_(_O_ OR _R_) = _P_(_O_) + _P_(_R_) - _P_(_O_ AND _R_) = .51 + .075 − .04 = .545

e. The area represents the African Americans that have type O blood and the Rh–– factor. 

f. The area represents the African Americans that have neither type O blood nor the Rh–– factor.

###  Try It  3.30

In a bookstore, the probability that the customer buys a novel is .6, and the probability that the customer buys a nonfiction book is .4. Suppose that the probability that the customer buys both is .2.

  1. Draw a Venn diagram representing the situation.
  2. Find the probability that the customer buys either a novel or a nonfiction book.
  3. In the Venn diagram, describe the overlapping area using a complete sentence.
  4. Suppose that some customers buy only compact disks. Draw an oval in your Venn diagram representing this event.

