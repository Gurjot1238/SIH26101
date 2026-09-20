# 3.1 Terminology

> Source: Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/statistics/pages/3-1-terminology
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.1 Terminology

Probability is a measure that is associated with how certain we are of results, or outcomes, of a particular activity. When the activity is a planned operation carried out under controlled conditions, it is called an **experiment**. If the result is _not_ predetermined, then the experiment is said to be a chance experiment. Each time the experiment is attempted is called a trial.

Examples of chance experiments include the following:

  * flipping a fair coin,
  * spinning a spinner,
  * drawing a marble at random from a bag, and
  * rolling a pair of dice.

A result of an experiment is called an **outcome**. The **sample space** of an experiment is the set, or collection, of all possible outcomes.

There are four main ways to represent a sample space:

| Flipping a Fair Coin | Flipping Two Fair Coins  
---|---|---  
**Systematic List of Outcomes** | heads (H)  
tails (T) | HH  
HT  
TH  
TT  
**Tree Diagram*** | ![A simple tree diagram illustrates the two possible outcomes of flipping a coin: Heads or Tails, demonstrating a basic concept in probability.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/338af2eaeec383a3051027bf9449d7448ee8ec79) Figure  3.2 | ![A tree diagram illustrates the possible outcomes of flipping a coin two times. The outcomes are Heads-Heads \(HH\), Heads-Tails \(HT\), Tails-Heads \(TH\), and Tails-Tails \(TT\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e565bab541fe9493628b8cbe535cd0292a8740bd) Figure  3.3  
**Venn Diagram*** | ![A diagram illustrating the outcomes of a coin flip, with 'Heads' occupying a large circular region and 'Tails' represented by the smaller surrounding area.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e6a1f399f79be6f5169e2b98d5cf0d989da815bd) Figure  3.4 | ![A Venn diagram illustrates the outcomes of flipping two coins. The left circle represents 'Heads on Coin 1' \(HT, HH\), the right 'Heads on Coin 2' \(TH, HH\). The overlap \(HH\) shows heads on both. A legend clarifies HH, HT, TH, and TT.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/25c26adee9586c0242e7f1af91a2700b84f7b442) Figure  3.5  
**Set Notation** |  S= { H, T } S= { H, T } |  S= { HH, HT, TH, TT } S= { HH, HT, TH, TT }  
  
Table  3.1

*We will investigate tree diagrams and Venn diagrams in Section 3.5.

Note—when represented as a set, the sample space is denoted with an uppercase _S_.

An event is any combination of outcomes. It is a subset of the sample space, so uppercase letters like _A_ and _B_ are commonly used to represent events. For example, if the experiment is to flip three fair coins, event _A_ might be getting at most one head.

The probability of an event _A_ is written _P_(_A_), and  0 ≤ P( A ) ≤ 1.P(A) = 0 0 ≤ P( A ) ≤ 1.P(A) = 0 means the event _A_ can never happen. _P_(_A_) = 1 means the event _A_ always happens.  P(A) = 0.5 P(A) = 0.5 means the event _A_ is **equally likely** to occur or not to occur.

![Image shows a number line from zero to one with a tick and label at one half. Tick zero represents the probability of an impossible event. Tick one represents the probability of a certain event. Tick one half represents the probability of an event that is equally likely to happen or not. Above the number line, an arrow points from one half toward zero showing that as probability moves closer to zero events are less likely. An arrow points from one half toward one showing that as probability moves closer to one events are more likely.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fe2893e27ce3d7f2a7038452e10b3d3777aea1bd) Figure  3.6

If two outcomes or events are equally likely, then they have equal probability. For example, if you toss a fair, six-sided die, each face (1, 2, 3, 4, 5, or 6) is as likely to occur as any other face. If you toss a fair coin, a Head (_H_) and a Tail (_T_) are equally likely to occur. If you randomly guess the answer to a true/false question on an exam, you are equally likely to select a correct answer or an incorrect answer.

To calculate the probability of an event _A_ when all outcomes in the sample space are equally likely, count the number of outcomes for event _A_ and divide by the total number of outcomes in the sample space. This is known as the theoretical probability of _A_.

Theoretical Probability of Event A

P(A)= Number of outcomes in event A Total number of possible outcomes. P(A)= Number of outcomes in event A Total number of possible outcomes.

3.1

For example, if you toss a fair dime and a fair nickel, the sample space is {_HH, TH, HT, TT_} where _T_ = tails and _H_ = heads. The sample space has four outcomes. Let _A_ represent the outcome _getting one head._ There are two outcomes that meet this condition {_HT, TH_}, so  P(A)= 2 4 = 1 2 =.5. P(A)= 2 4 = 1 2 =.5.

Theoretical probability is not sufficient in all situations, however. Suppose we want to calculate the probability that a randomly selected car will run a red light at a given intersection. In this case, we need to look at events that _have_ occurred, not theoretical possibilities. We could install a traffic camera and count the number of times that cars failed to stop when the light was red and the total number of cars that passed through the intersection for a period of time. These data will allow us to calculate the experimental, or empirical, probability that a car runs the red light.

Experimental Probability of Event A

P(A)= Number of times event A occurs. Total number of trials P(A)= Number of times event A occurs. Total number of trials

3.2

While theoretical and experimental methods provide two different ways to calculate probability, these methods are closely related. If you flip one fair coin, there is one way to obtain heads and two possible outcomes. So, the theoretical probability of heads is  1 2 1 2 . Probability does not predict short-term results, however. If an experiment involves flipping a coin 10 times, you should not expect exactly five heads and five tails. The probability of any outcome measures the long-term relative frequency of that outcome. If you continue to flip the coin (from 20 to 2,000 to 20,000 times) the relative frequency of heads approaches .5 (the probability of heads).This important characteristic of probability experiments is known as the law of large numbers, which states that as the number of repetitions of an experiment is increased, the relative frequency obtained in the experiment tends to become closer and closer to the theoretical probability. Even though the outcomes do not happen according to any set pattern or order, overall, the long-term observed, or empirical, relative frequency will approach the theoretical probability.

Suppose you roll one fair, six-sided die with the numbers {1, 2, 3, 4, 5, 6} on its faces. Let event _E_ = rolling a number that is at least five. There are two outcomes {5, 6}.  P(E)= 2 6 . P(E)= 2 6 . If you were to roll the die only a few times, you would not be surprised if your observed results did not match the probability. If you were to roll the die a very large number of times, you would expect that, overall,  2 6 2 6 of the rolls would result in an outcome of _at least five_. You would not expect exactly  2 6 2 6 , but the long-term relative frequency of obtaining this result would approach the theoretical probability of  2 6 2 6 as the number of repetitions grows larger and larger.

It is important to realize that in many situations, the outcomes are not equally likely. A coin or die may be unfair, or **biased**. Two math professors in Europe had their statistics students test the Belgian one-euro coin and discovered that in 250 trials, a head was obtained 56 percent of the time and a tail was obtained 44 percent of the time. The data seem to show that the coin is not a fair coin; more repetitions would be helpful to draw a more accurate conclusion about such bias. Some dice may be biased. Look at the dice in a game you have at home; the spots on each face are usually small holes carved out and then painted to make the spots visible. Your dice may or may not be biased; it is possible that the outcomes may be affected by the slight weight differences due to the different numbers of holes in the faces. Gambling casinos make a lot of money depending on outcomes from rolling dice, so casino dice are made differently to eliminate bias. Casino dice have flat faces; the holes are completely filled with paint having the same density as the material that the dice are made out of so that each face is equally likely to occur. Later we will learn techniques to use to work with probabilities for events that are not equally likely.  
  

OR EventAn outcome is in the event _A_ OR _B_ if the outcome is in _A_ or is in _B_ or is in both _A_ and _B_. For example, let _A_ = {1, 2, 3, 4, 5} and _B_ = {4, 5, 6, 7, 8}. _A_ OR _B_ = {1, 2, 3, 4, 5, 6, 7, 8}. Notice that 4 and 5 are **not** listed twice.  
  

AND EventAn outcome is in the event _A_ AND _B_ if the outcome is in both _A_ and _B_ at the same time. For example, let _A_ and _B_ be   
{1, 2, 3, 4, 5} and {4, 5, 6, 7, 8}, respectively. Then _A_ AND _B_ = {4, 5}.

The complement of event _A_ is denoted _A′_ (read "_A_ prime"). _A′_ consists of all outcomes that are **not** in _A_. Notice that   
_P_(_A_) + _P_(_A′_) = 1. For example, let _S_ = {1, 2, 3, 4, 5, 6} and let _A_ = {1, 2, 3, 4}. Then, _A′_ = {5, 6}. _P_(_A_) = 4646, _P_(_A′_) = 2626, and _P_(_A_) + _P_(_A′_) =  4 6 \+  2 6 4 6 \+  2 6 = 1.

The conditional probability of _A_ given _B_ is written _P_(_A_ |_B_), read "the probability of _A_ , given _B_." _P_(_A_ |_B_) is the probability that event _A_ will occur given that the event _B_ has already occurred. **A conditional probability reduces the sample space**. We calculate the probability of _A_ from the reduced sample space _B_. The formula to calculate _P_(_A_ |_B_) is _P_(_A_ |_B_) =  P(A AND B) P(B) P(A AND B) P(B) where _P_(_B_) is greater than zero.

For example, suppose we toss one fair, six-sided die. The sample space _S_ = {1, 2, 3, 4, 5, 6}. Let _A_ = {2, 3} and _B_ = {2, 4, 6}. _P_(_A_ |_B_) represents the probability that a randomly selected outcome is in _A given that_ it is in _B_. We know that the outcome must lie in _B_ , so there are three possible outcomes. There is only one outcome in _B_ that also lies in _A_ , so _P_(_A_ |_B_) =  1 3 1 3 .

We get the same result by using the formula. Remember that _S_ has six outcomes.

_P_(_A_ |_B_) =  P(A AND B) P(B) = (the number of outcomes that are 2 or 3 and even in S) 6 (the number of outcomes that are even in S) 6 = 1 6 3 6 = 1 3 P(A AND B) P(B) = (the number of outcomes that are 2 or 3 and even in S) 6 (the number of outcomes that are even in S) 6 = 1 6 3 6 = 1 3

Understanding Terminology and SymbolsIt is important to read each problem carefully to think about and understand what the events are. Understanding the wording is the first very important step in solving probability problems. Reread the problem several times if necessary. Clearly identify the event of interest. Determine whether there is a condition stated in the wording that would indicate that the probability is conditional; carefully identify the condition, if any.

###  Example  3.1

####  Problem

The sample space _S_ is the whole numbers starting at one and less than 20.

  1. _S_ = ________ 

Let event _A_ = the even numbers and event _B_ = numbers greater than 13.

  2. _A_ = ________, _B_ = ________
  3. _P_(_A_) = ________, _P_(_B_) = ________
  4. _A_ AND _B_ = ________, _A_ OR _B_ = ________
  5. _P_(_A_ AND _B_) = ________, _P_(_A_ OR _B_) = ________
  6. _A′_ = ________, _P_(_A′_) = ________
  7. _P_(_A_) + _P_(_A′_) = ________
  8. _P_(_A_ |_B_) = ________, _P_(_B_ |_A_) = ________; are the probabilities equal?

####  Solution

  1. _S_ = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19}
  2. _A_ = {2, 4, 6, 8, 10, 12, 14, 16, 18}, _B_ = {14, 15, 16, 17, 18, 19}
  3. _P_(_A_) =  number of outcomes in A number of outcomes in S number of outcomes in A number of outcomes in S = 919 919 , _P_(_B_) =  number of outcomes in B number of outcomes in S number of outcomes in B number of outcomes in S =  6 19 6 19
  4. The set _A_ AND _B_ contains all outcomes that lie in both sets _A_ and _B_ , so _A_ AND _B_ = {14,16,18}, The set _A_ OR _B_ contains all outcomes that lie either of the sets _A_ or _B_ , so _A_ OR _B_ = {2, 4, 6, 8, 10, 12, 14, 15, 16, 17, 18, 19}.
  5. _P_(_A_ AND _B_) = 319 ,319 , _P_(_A_ OR _B_) =  12 19 12 19
  6. _A'_ consists of all outcomes in the sample space, _S_ , that DO NOT lie in _A_ , so _A′_ = 1, 3, 5, 7, 9, 11, 13, 15, 17, 19; _P_(_A′_) =  1019 1019 .
  7. _P_(_A_) + _P_(_A′_) =  919 919 \+  1019 1019 = 1
  8. _P_(_A_ |_B_) =  P(A AND B) P(B) P(A AND B) P(B) = 3 19 6 19 = 3 19 6 19 =  3 6 3 6 , _P_(_B_ |_A_) =  P(A AND B) P(A) P(A AND B) P(A) = 3 19 9 19 = 3 19 9 19 =  3 9 3 9 , No, the probabilities are not equal.

###  Try It  3.1

The sample space _S_ is all the ordered pairs of two whole numbers, the first from one to three and the second from one to four (Example: (1, 4)).  
  

  1. _S_ = ________   
  
Let event _A_ = the sum is even and event _B_ = the first number is prime.
  2. _A_ = ________, _B_ = ________
  3. _P_(_A_) = ________, _P_(_B_) = ________
  4. _A_ AND _B_ = ________, _A_ OR _B_ = ________
  5. _P_(_A_ AND _B_) = ________, _P_(_A_ OR _B_) = ________
  6. _B′_ = ________, _P_(_B′_) = ________
  7. _P_(_A_) + _P_(_A′_) = ________
  8. _P_(_A_ |_B_) = ________, _P_(_B_ |_A_) = ________; are the probabilities equal?

###  Example  3.2

####  Problem

A fair, six-sided die is rolled. The sample space, _S_ , is {1, 2, 3, 4, 5, 6}. Describe each event and calculate its probability.

  1. Event _T_ = the outcome is two.
  2. Event _A_ = the outcome is an even number.
  3. Event _B_ = the outcome is less than four.
  4. The complement of _A_
  5. _A_ GIVEN _B_
  6. _B_ GIVEN _A_
  7. _A_ AND _B_
  8. _A_ OR _B_
  9. _A_ OR _B′_
  10. Event _N_ = the outcome is a prime number.
  11. Event _I_ = the outcome is seven.

####  Solution

  1. _T_ = {2}, _P_(_T_) =  number of outcomes in T number of outcomes in S number of outcomes in T number of outcomes in S = 1616
  2. _A_ = {2, 4, 6}, _P_(_A_) = 3636 = 1212
  3. _B_ = {1, 2, 3}, _P_(_B_) = 3636 = 1212
  4. _A′_ = {1, 3, 5}, _P_(_A′_) = 3636 = 1212
  5. _A_ |_B_ = {2}, There are three outcomes in _B_ , and only 1 of these lies in _A_ , so _P_(_A_ |_B_) = 1313
  6. _B_ |_A_ = {2}, There are three outcomes in _A_ , and only 1 of these lies in _B_ , so _P_(_B_ |_A_) = 1313
  7. _A_ AND _B_ = {2}, _P_(_A_ AND _B_) = 1616
  8. _A_ OR _B_ = {1, 2, 3, 4, 6}, _P_(_A_ OR _B_) = 5656
  9. _A_ OR _B′_ = {2, 4, 5, 6}, _P_(_A_ OR _B′_) = 4646 = 2323
  10. _N_ = {2, 3, 5}, _P_(_N_) = 1212
  11. It is impossible to roll a die and get an outcome of 7, so _P_(7) = 0.

###  Example  3.3

[Table 3.2](<3-1-terminology#ch03_M02-tbl001>) describes the distribution of a random sample _S_ of 100 individuals, organized by gender and whether they are right or left-handed. 

| Right-Handed | Left-Handed  
---|---|---  
Males | 43 | 9  
Females | 44 | 4  
  
Table  3.2

####  Problem

Let’s denote the events _M_ = the subject is male, _F_ = the subject is female, _R_ = the subject is right-handed, _L_ = the subject is left-handed. Compute the following probabilities:

  1. _P_(_M_)
  2. _P_(_F_)
  3. _P_(_R_)
  4. _P_(_L_)
  5. _P_(_M_ AND _R_)
  6. _P_(_F_ AND _L_)
  7. _P_(_M_ OR _F_)
  8. _P_(_M_ OR _R_)
  9. _P_(_F_ OR _L_)
  10. _P_(_M'_)
  11. _P_(_R_ |_M_)
  12. _P_(_F_ |_L_)
  13. _P_(_L_ |_F_)

####  Solution

  1. P(M)= number of males total number of subjects = 43+9 43+9+44+4 = 52 100 =.52 P(M)= number of males total number of subjects = 43+9 43+9+44+4 = 52 100 =.52
  2. P(F)= number of females total number of subjects = 44+4 43+9+44+4 = 48 100 =.48 P(F)= number of females total number of subjects = 44+4 43+9+44+4 = 48 100 =.48
  3. P(R)= number of right-handed subjects total number of subjects = 43+44 43+9+44+4 = 87 100 =.87 P(R)= number of right-handed subjects total number of subjects = 43+44 43+9+44+4 = 87 100 =.87
  4. P(L)= number of left-handed subjects total number of subjects = 9+4 43+9+44+4 = 13 100 =.13 P(L)= number of left-handed subjects total number of subjects = 9+4 43+9+44+4 = 13 100 =.13
  5. P(M and R)= number of male, right-handed subjects total number of subjects = 43 100 =.43 P(M and R)= number of male, right-handed subjects total number of subjects = 43 100 =.43
  6. P(F and L)= number of female, left-handed subjects total number of subjects = 4 100 =.04 P(F and L)= number of female, left-handed subjects total number of subjects = 4 100 =.04
  7. P(M or F)= number of subjects that are male or female total number of subjects = 52+48 100 = 100 100 =1 P(M or F)= number of subjects that are male or female total number of subjects = 52+48 100 = 100 100 =1
  8. P(M or R)= number of subjects that are male or right-handed total number of subjects = 43+9+44 100 = 96 100 =.96 P(M or R)= number of subjects that are male or right-handed total number of subjects = 43+9+44 100 = 96 100 =.96
  9. P(F or L)= number of subjects that are female or left-handed total number of subjects = 44+4+9 100 = 57 100 =.57 P(F or L)= number of subjects that are female or left-handed total number of subjects = 44+4+9 100 = 57 100 =.57
  10. P( M ' )= number of subjects who are not male total number of subjects = 44+4 43+9+44+4 = 48 100 =.48 P( M ' )= number of subjects who are not male total number of subjects = 44+4 43+9+44+4 = 48 100 =.48
  11. P(R|M)= P(R and M) P(M) = 0.43 0.52 ˜=.8269 P(R|M)= P(R and M) P(M) = 0.43 0.52 ˜=.8269 (rounded to four decimal places) 
  12. P(F|L)= P(F and L) P(L) = 0.04 0.13 ˜=.3077 P(F|L)= P(F and L) P(L) = 0.04 0.13 ˜=.3077 (rounded to four decimal places)
  13. P(L|F)= P(L and F) P(F) = 0.04 0.48 ˜=.0833 P(L|F)= P(L and F) P(F) = 0.04 0.48 ˜=.0833 (rounded to four decimal places)

