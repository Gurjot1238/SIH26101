# 3.1 Terminology

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/3-1-terminology
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.1 Terminology

Probability is a measure that is associated with how certain we are of outcomes of a particular experiment or activity. An experiment is a planned operation carried out under controlled conditions. If the result is not predetermined, then the experiment is said to be a **chance** experiment. Flipping one fair coin twice is an example of an experiment.

A result of an experiment is called an outcome. The sample space of an experiment is the set of all possible outcomes. Three ways to represent a sample space are: to list the possible outcomes, to create a tree diagram, or to create a Venn diagram. The uppercase letter _S_ is used to denote the sample space. For example, if you flip one fair coin, _S_ = {_H_ , _T_} where _H_ = heads and _T_ = tails are the outcomes.

An event is any combination of outcomes. Upper case letters like _A_ and _B_ represent events. For example, if the experiment is to flip one fair coin, event _A_ might be getting at most one head. The probability of an event _A_ is written _P_(_A_).

The probability of any outcome is the long-term relative frequency of that outcome. **Probabilities are between zero and one, inclusive** (that is, zero and one and all numbers between these values). _P_(_A_) = 0 means the event _A_ can never happen. _P_(_A_) = 1 means the event _A_ always happens. _P_(_A_) = 0.5 means the event _A_ is equally likely to occur or not to occur. For example, if you flip one fair coin repeatedly (from 20 to 2,000 to 20,000 times) the relative frequency of heads approaches 0.5 (the probability of heads).

Equally likely means that each outcome of an experiment occurs with equal probability. For example, if you toss a fair, six-sided die, each face (1, 2, 3, 4, 5, or 6) is as likely to occur as any other face. If you toss a fair coin, a Head (_H_) and a Tail (_T_) are equally likely to occur. If you randomly guess the answer to a true/false question on an exam, you are equally likely to select a correct answer or an incorrect answer.

**To calculate the probability of an event _A_ when all outcomes in the sample space are equally likely**, count the number of outcomes for event _A_ and divide by the total number of outcomes in the sample space. For example, if you toss a fair dime and a fair nickel, the sample space is {_HH_ , _TH_ , _HT_ , _TT_} where _T_ = tails and _H_ = heads. The sample space has four outcomes. _A_ = getting one head. There are two outcomes that meet this condition {_HT_ , _TH_}, so _P_(_A_) =  2 4 2 4 = 0.5.

Suppose you roll one fair six-sided die, with the numbers {1, 2, 3, 4, 5, 6} on its faces. Let event _E_ = rolling a number that is at least five. There are two outcomes {5, 6}. _P_(_E_) =  2 6 2 6 . If you were to roll the die only a few times, you would not be surprised if your observed results did not match the probability. If you were to roll the die a very large number of times, you would expect that, overall, 2626 of the rolls would result in an outcome of "at least five". You would not expect exactly 2626. The long-term relative frequency of obtaining this result would approach the theoretical probability of 2626 as the number of repetitions grows larger and larger.

This important characteristic of probability experiments is known as the law of large numbers which states that as the number of repetitions of an experiment is increased, the relative frequency obtained in the experiment tends to become closer and closer to the theoretical probability. Even though the outcomes do not happen according to any set pattern or order, overall, the long-term observed relative frequency will approach the theoretical probability. (The word **empirical** is often used instead of the word observed.)

It is important to realize that in many situations, the outcomes are not equally likely. A coin or die may be unfair, or **biased**. Two math professors in Europe had their statistics students test the Belgian one Euro coin and discovered that in 250 trials, a head was obtained 56% of the time and a tail was obtained 44% of the time. The data seem to show that the coin is not a fair coin; more repetitions would be helpful to draw a more accurate conclusion about such bias. Some dice may be biased. Look at the dice in a game you have at home; the spots on each face are usually small holes carved out and then painted to make the spots visible. Your dice may or may not be biased; it is possible that the outcomes may be affected by the slight weight differences due to the different numbers of holes in the faces. Gambling casinos make a lot of money depending on outcomes from rolling dice, so casino dice are made differently to eliminate bias. Casino dice have flat faces; the holes are completely filled with paint having the same density as the material that the dice are made out of so that each face is equally likely to occur. Later we will learn techniques to use to work with probabilities for events that are not equally likely.  
  

"OR" Event:An outcome is in the event _A_ OR _B_ if the outcome is in _A_ or is in _B_ or is in both _A_ and _B_. For example, let _A_ = {1, 2, 3, 4, 5} and _B_ = {4, 5, 6, 7, 8}. _A_ OR _B_ = {1, 2, 3, 4, 5, 6, 7, 8}. Notice that 4 and 5 are NOT listed twice.  
  

"AND" Event:An outcome is in the event _A_ AND _B_ if the outcome is in both _A_ and _B_ at the same time. For example, let _A_ and _B_ be {1, 2, 3, 4, 5} and {4, 5, 6, 7, 8}, respectively. Then _A_ AND _B_ = {4, 5}.

The complement of event _A_ is denoted _A′_ (read "_A_ prime"). _A′_ consists of all outcomes that are **NOT** in _A_. Notice that _P_(_A_) + _P_(_A′_) = 1. For example, let _S_ = {1, 2, 3, 4, 5, 6} and let _A_ = {1, 2, 3, 4}. Then, _A′_ = {5, 6}. _P_(_A_) = 4646, _P_(_A′_) = 2626, and _P_(_A_) + _P_(_A′_) =  4 6 \+  2 6 4 6 \+  2 6 = 1

The conditional probability of _A_ given _B_ is written _P_(_A_ |_B_). _P_(_A_ |_B_) is the probability that event _A_ will occur given that the event _B_ has already occurred. **A conditional reduces the sample space**. We calculate the probability of _A_ from the reduced sample space _B_. The formula to calculate _P_(_A_ |_B_) is _P_(_A_ |_B_) =  P(A AND B) P(B) P(A AND B) P(B) where _P_(_B_) is greater than zero.

For example, suppose we toss one fair, six-sided die. The sample space _S_ = {1, 2, 3, 4, 5, 6}. Let _A_ = face is 2 or 3 and _B_ = face is even (2, 4, 6). To calculate _P_(_A_ |_B_), we count the number of outcomes 2 or 3 in the sample space _B_ = {2, 4, 6}. Then we divide that by the number of outcomes _B_ (rather than _S_).

We get the same result by using the formula. Remember that _S_ has six outcomes.

_P_(_A_ |_B_) =  P(AANDB) P(B) = (the number of outcomes that are 2 or 3 and even in S) 6 (the number of outcomes that are even in S) 6 = 1 6 3 6 = 1 3 P(AANDB) P(B) = (the number of outcomes that are 2 or 3 and even in S) 6 (the number of outcomes that are even in S) 6 = 1 6 3 6 = 1 3

Understanding Terminology and SymbolsIt is important to read each problem carefully to think about and understand what the events are. Understanding the wording is the first very important step in solving probability problems. Reread the problem several times if necessary. Clearly identify the event of interest. Determine whether there is a condition stated in the wording that would indicate that the probability is conditional; carefully identify the condition, if any.

###  Example  3.1

####  Problem

The sample space _S_ is the whole numbers starting at one and less than 20.

  1. _S_ = _____________________________ 

Let event _A_ = the even numbers and event _B_ = numbers greater than 13.

  2. _A_ = _____________________, _B_ = _____________________
  3. _P_(_A_) = _____________, _P_(_B_) = ________________
  4. _A_ AND _B_ = ____________________, _A_ OR _B_ = ________________
  5. _P_(_A_ AND _B_) = _________, _P_(_A_ OR _B_) = _____________
  6. _A′_ = _____________, _P_(_A′_) = _____________
  7. _P_(_A_) + _P_(_A′_) = ____________
  8. _P_(_A_ |_B_) = ___________, _P_(_B_ |_A_) = _____________; are the probabilities equal?

####  Solution

  1. _S_ = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19}
  2. _A_ = {2, 4, 6, 8, 10, 12, 14, 16, 18}, _B_ = {14, 15, 16, 17, 18, 19}
  3. _P_(_A_) = 919 919 , _P_(_B_) =  6 19 6 19
  4. _A_ AND _B_ = {14,16,18}, _A_ OR _B_ = {2, 4, 6, 8, 10, 12, 14, 15, 16, 17, 18, 19}
  5. _P_(_A_ AND _B_) = 319 319 , _P_(_A_ OR _B_) =  12 19 12 19
  6. _A′_ = 1, 3, 5, 7, 9, 11, 13, 15, 17, 19; _P_(_A′_) =  1019 1019
  7. _P_(_A_) + _P_(_A′_) = 1 ( 919 919 \+  1019 1019 = 1)
  8. _P_(_A_ |_B_) =  P(A AND B) P(B) P(A AND B) P(B) =  3 6 3 6 , _P_(_B_ |_A_) =  P(A AND B) P(A) P(A AND B) P(A) =  3 9 3 9 , No

###  Try It  3.1

The sample space _S_ is all the ordered pairs of two whole numbers, the first from one to three and the second from one to four (Example: (1, 4)).  
  

  1. _S_ = _____________________________   
  
Let event _A_ = the sum is even and event _B_ = the first number is prime.
  2. _A_ = _____________________, _B_ = _____________________
  3. _P_(_A_) = _____________, _P_(_B_) = ________________
  4. _A_ AND _B_ = ____________________, _A_ OR _B_ = ________________
  5. _P_(_A_ AND _B_) = _________, _P_(_A_ OR _B_) = _____________
  6. _B′_ = _____________, _P_(_B′_) = _____________
  7. _P_(_A_) + _P_(_A′_) = ____________
  8. _P_(_A_ |_B_) = ___________, _P_(_B_ |_A_) = _____________; are the probabilities equal?

###  Example  3.2

####  Problem

A fair, six-sided die is rolled. Describe the sample space _S_ , identify each of the following events with a subset of _S_ and compute its probability (an outcome is the number of dots that show up).

  1. Event _T_ = the outcome is two.
  2. Event _A_ = the outcome is an even number.
  3. Event _B_ = the outcome is less than four.
  4. The complement of _A_.
  5. _A_ GIVEN _B_
  6. _B_ GIVEN _A_
  7. _A_ AND _B_
  8. _A_ OR _B_
  9. _A_ OR _B′_
  10. Event _N_ = the outcome is a prime number.
  11. Event _I_ = the outcome is seven.

####  Solution

  1. _T_ = {2}, _P_(_T_) = 1616
  2. _A_ = {2, 4, 6}, _P_(_A_) = 1212
  3. _B_ = {1, 2, 3}, _P_(_B_) = 1212
  4. _A′_ = {1, 3, 5}, _P_(_A′_) = 1212
  5. _A_ |_B_ = {2}, _P_(_A_ |_B_) = 1313
  6. _B_ |_A_ = {2}, _P_(_B_ |_A_) = 1313
  7. _A_ AND _B_ = {2}, _P_(_A_ AND _B_) = 1616
  8. _A_ OR _B_ = {1, 2, 3, 4, 6}, _P_(_A_ OR _B_) = 5656
  9. _A_ OR _B′_ = {2, 4, 5, 6}, _P_(_A_ OR _B′_) = 2323
  10. _N_ = {2, 3, 5}, _P_(_N_) = 1212
  11. A six-sided die does not have seven dots. _P_(7) = 0.

###  Example  3.3

[Table 3.1](<3-1-terminology#ch03_M02-tbl001>) describes the distribution of a random sample _S_ of 100 individuals, organized by gender and whether they are right- or left-handed. 

| Right-handed | Left-handed  
---|---|---  
Males | 43 | 9  
Females | 44 | 4  
  
Table  3.1

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

  1. _P_(_M_) = 0.52
  2. _P_(_F_) = 0.48
  3. _P_(_R_) = 0.87
  4. _P_(_L_) = 0.13
  5. _P_(_M_ AND _R_) = 0.43
  6. _P_(_F_ AND _L_) = 0.04
  7. _P_(_M_ OR _F_) = 1
  8. _P_(_M_ OR _R_) = 0.96
  9. _P_(_F_ OR _L_) = 0.57
  10. _P_(_M'_) = 0.48
  11. _P_(_R_ |_M_) = 0.8269 (rounded to four decimal places)
  12. _P_(_F_ |_L_) = 0.3077 (rounded to four decimal places)
  13. _P_(_L_ |_F_) = 0.0833

