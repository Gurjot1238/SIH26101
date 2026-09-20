# 3.3 Two Basic Rules of Probability

> Source: Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/statistics/pages/3-3-two-basic-rules-of-probability
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.3 Two Basic Rules of Probability

In calculating probability, there are two rules to consider when you are determining if two events are independent or dependent and if they are mutually exclusive or not.

### The Multiplication Rule

If _A_ and _B_ are two events defined on a sample space, then _P_(_A_ AND _B_) = _P_(_B_)_P_(_A_ |_B_).

This equation can be rewritten as _P_(_A_ AND _B_) = _P_(_B_)_P_(_A_ |_B_), the multiplication rule.

If _A_ and _B_ are independent, then _P_(_A_ |_B_) = _P_(_A_). In this special case, _P_(_A_ AND _B_) = _P_(_A_ |_B_)_P_(_B_) becomes _P_(_A_ AND _B_) = _P_(_A_)_P_(_B_).

A bag contains four green marbles, three red marbles, and two yellow marbles. Mark draws two marbles from the bag without replacement. The probability that he draws a yellow marble and then a green marble is

P( yellow and green )=P( yellow )⋅P( green | yellow ) = 2 9 ⋅ 4 8 = 1 9 P( yellow and green )=P( yellow )⋅P( green | yellow ) = 2 9 ⋅ 4 8 = 1 9

Notice that  P( green | yellow )= 4 8 P( green | yellow )= 4 8 . After the yellow marble is drawn, there are four green marbles in the bag and eight marbles in all.

### The Addition Rule

If _A_ and _B_ are defined on a sample space, then _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) − _P_(_A_ AND _B_).

Draw one card from a standard deck of playing cards. Let _H_ = the card is a heart, and let _J_ = the card is a jack. These events are not mutually exclusive because a card can be both a heart and a jack.

P( H or J )=P( H )+P( J )−P( H and J ) = 13 52 + 4 52 − 1 52 = 16 52 = 4 13 ≈.3077 P( H or J )=P( H )+P( J )−P( H and J ) = 13 52 + 4 52 − 1 52 = 16 52 = 4 13 ≈.3077

3.3

If _A_ and _B_ are mutually exclusive, then _P_(_A_ AND _B_) = 0. Then _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) − _P_(_A_ AND _B_) becomes   
_P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_).

Draw one card from a standard deck of playing cards. Let _H_ = the card is a heart and _S_ = the card is a spade. These events are mutually exclusive because a card cannot be a heart and a spade at the same time. The probability that the card is a heart or a spade is

P( H or S )=P( H )+P( S ) = 13 52 + 13 52 = 26 52 = 1 2 =.5 P( H or S )=P( H )+P( S ) = 13 52 + 13 52 = 26 52 = 1 2 =.5

3.4

###  Example  3.14

Klaus is trying to choose where to go on vacation. His two choices are: _A_ = New Zealand and _B_ = Alaska.

  * Klaus can only afford one vacation. The probability that he chooses _A_ is _P_(_A_) = .6 and the probability that he chooses _B_ is _P_(_B_) = .35.
  * _P_(_A_ AND _B_) = 0 because Klaus can only afford to take one vacation.
  * Therefore, the probability that he chooses either New Zealand or Alaska is _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) = .6 + .35 = .95. Note that the probability that he does not choose to go anywhere on vacation must be .05.

###  Example  3.15

Carlos plays college soccer. He makes a goal 65 percent of the time he shoots. Carlos is going to attempt two goals in a row in the next game. _A_ = the event Carlos is successful on his first attempt. _P_(_A_) = .65. _B_ = the event Carlos is successful on his second attempt. _P_(_B_) = .65. Carlos tends to shoot in streaks. The probability that he makes the second goal **given** that he made the first goal is .90.  
  

####  Problem

a. What is the probability that he makes both goals?

####  Solution

a. The problem is asking you to find _P_(_A_ AND _B_) = _P_(_B_ AND _A_). Since _P_(_B_ |_A_) = .90: _P_(_B_ AND _A_) = _P_(_B_ |_A_) _P_(_A_) = (.90)(.65) = .585.

Carlos makes the first and second goals with probability .585.  
  

####  Problem

b. What is the probability that Carlos makes either the first goal or the second goal?

####  Solution

b. The problem is asking you to find _P_(_A_ OR _B_).

_P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) − _P_(_A_ AND _B_) = .65 + .65 − .585 = .715

Carlos makes either the first goal or the second goal with probability .715.  
  

####  Problem

c. Are _A_ and _B_ independent?

####  Solution

c. No, they are not, because _P_(_B_ AND _A_) = .585.

_P_(_B_)_P_(_A_) = (.65)(.65) = .423

.423 ≠ .585 = _P_(_B_ AND _A_)

So, _P_(_B_ AND _A_) is **not** equal to _P_(_B_)_P_(_A_).  
  

####  Problem

d. Are _A_ and _B_ mutually exclusive?

####  Solution

d. No, they are not because _P_(_A_ and _B_) = .585.

To be mutually exclusive, _P_(_A_ AND _B_) must equal zero.

###  Try It  3.15

Helen plays basketball. For free throws, she makes the shot 75 percent of the time. Helen must now attempt two free throws. _C_ = the event that Helen makes the first shot.   
_P_(_C_) = .75. _D_ = the event Helen makes the second shot. _P_(_D_) = .75. The probability that Helen makes the second free throw given that she made the first is .85. What is the probability that Helen makes both free throws?

###  Example  3.16

A community swim team has **150** members. **Seventy-five** of the members are advanced swimmers. **Forty-seven** of the members are intermediate swimmers. The remainder are novice swimmers. **Forty** of the advanced swimmers practice four times a week. **Thirty** of the intermediate swimmers practice four times a week. **Ten** of the novice swimmers practice four times a week. Suppose one member of the swim team is chosen randomly.  
  

####  Problem

a. What is the probability that the member is a novice swimmer?

####  Solution

a. There are **150** members; 75 of these are advanced, and 47 of these are intermediate swimmers. So there are 150 − 75 − 47 = **28** novice swimmers. The probability that a randomly selected swimmer is a novice is 28150.28150.  
  

####  Problem

b. What is the probability that the member practices four times a week?

####  Solution

b.  40 + 30 + 10  150 = 80 150 40 + 30 + 10  150 = 80 150   
  

####  Problem

c. What is the probability that the member is an advanced swimmer and practices four times a week?

####  Solution

c. There are 40 advanced swimmers who practice four times per week, so the probability is 40150.40150.  
  

####  Problem

d. What is the probability that a member is an advanced swimmer and an intermediate swimmer? Are being an advanced swimmer and being an intermediate swimmer mutually exclusive? Why or why not?

####  Solution

d. _P_(advanced AND intermediate) = 0, so these are mutually exclusive events. A swimmer cannot be an advanced swimmer and an intermediate swimmer at the same time.  
  

####  Problem

e. Are being a novice swimmer and practicing four times a week independent events? Why or why not?

####  Solution

e. No, these are not independent events.   
_P_(novice AND practices four times per week) = .0667   
_P_(novice)_P_(practices four times per week) = .0996   
.0667 ≠ .0996

###  Try It  3.16

A school has 200 seniors of whom 140 will be going to college next year. Forty will be going directly to work. The remainder are taking a gap year. Fifty of the seniors going to college are on their school's sports teams. Thirty of the seniors going directly to work are on their school's sports teams. Five of the seniors taking a gap year are on their schools sports teams. What is the probability that a senior is taking a gap year?

###  Example  3.17

Felicity attends a school in Modesto, CA. The probability that Felicity enrolls in a math class is .2 and the probability that she enrolls in a speech class is .65. The probability that she enrolls in a math class GIVEN that she enrolls in speech class is .25.

Let _M_ = math class, _S_ = speech class, and _M_ |_S_ = math given speech.

####  Problem

  1. What is the probability that Felicity enrolls in math and speech?   
Find _P_(_M_ AND _S_) = _P_(_M_ |_S_)_P_(_S_).
  2. What is the probability that Felicity enrolls in math or speech classes?   
Find _P_(_M_ OR _S_) = _P_(_M_) + _P_(_S_) − _P_(_M_ AND _S_).
  3. Are _M_ and _S_ independent? Is _P_(_M_ |_S_) = _P_(_M_)?
  4. Are _M_ and _S_ mutually exclusive? Is _P_(_M_ AND _S_) = 0?

####  Solution

a. _P_(_M_ AND _S_) = _P_(_M_ |_S_)_P_(_S_) = .25(.65) = .1625

b. _P_(_M_ OR _S_) = _P_(_M_) + _P_(_S_) − _P_(_M_ AND _S_) = .2 + .65 − .1625 = .6875

c. No, _P_(_M_ |_S_) = .25 and _P_(_M_) = .2.

d. No, _P_(_M_ AND _S_) = .1625.

###  Try It  3.17

A student goes to the library. Let events _B_ = the student checks out a book and _D_ = the student checks out a DVD. Suppose that _P_(_B_) = .40, _P_(_D_) = .30, and _P_(_D_ |_B_) = .5.

  1. Find _P_(_B_ AND _D_).
  2. Find _P_(_B_ OR _D_).

###  Example  3.18

Researchers are studying one particular type of disease that affects women more often than men. Studies show that about one woman in seven (approximately 14.3 percent) who live to be 90 will develop the disease. Suppose that of those women who develop this disease, a test is negative 2 percent of the time. Also suppose that in the general population of women, the test for the disease is negative about 85 percent of the time. Let _B_ = woman develops the disease and let _N_ = tests negative. Suppose one woman is selected at random.

####  Problem

a. What is the probability that the woman develops the disease? What is the probability that woman tests negative?

####  Solution

a. _P_(_B_) = .143; _P_(_N_) = .85  
  

####  Problem

b. Given that the woman develops the disease, what is the probability that she tests negative?

####  Solution

b. Among women who develop the disease, the test is negative 2 percent of the time, so _P_(_N_ |_B_) = .02  
  

####  Problem

c. What is the probability that the woman has the disease AND tests negative?

####  Solution

c. _P_(_B_ AND _N_) = _P_(_B_)_P_(_N_ |_B_) = (.143)(.02) = .0029  
  

####  Problem

d. What is the probability that the woman has the disease OR tests negative?

####  Solution

d. _P_(_B_ OR _N_) = _P_(_B_) + _P_(_N_) − _P_(_B_ AND _N_) = .143 + .85 − .0029 = .9901  
  

####  Problem

e. Are having the disease and testing negative independent events?

####  Solution

e. No. _P_(_N_) = .85; _P_(_N_ |_B_) = .02. So, _P_(_N_ |_B_) does not equal _P_(_N_).  
  

####  Problem

f. Are having the disease and testing negative mutually exclusive?

####  Solution

f. No. _P_(_B_ AND _N_) = .0029. For _B_ and _N_ to be mutually exclusive, _P_(_B_ AND _N_) must be zero.

###  Try It  3.18

A school has 200 seniors of whom 140 will be going to college next year. Forty will be going directly to work. The remainder are taking a gap year. Fifty of the seniors going to college are on their school's sports teams. Thirty of the seniors going directly to work are on their school's sports teams. Five of the seniors taking a gap year are on their school's sports teams. What is the probability that a senior is going to college and plays sports?

###  Example  3.19

####  Problem

Refer to the information in [Example 3.18](<3-3-two-basic-rules-of-probability#example5>). _P_ = tests positive.

  1. Given that a woman develops the disease, what is the probability that she tests positive? Find _P_(_P_ |_B_) = 1 − _P_(_N_ |_B_).
  2. What is the probability that a woman develops the disease and tests positive? Find _P_(_B_ AND _P_) = _P_(_P_ |_B_)_P_(_B_).
  3. What is the probability that a woman does not develop the disease? Find _P_(_B′_) = 1 − _P_(_B_).
  4. What is the probability that a woman tests positive for the disease? Find _P_(_P_) = 1 − _P_(_N_).

####  Solution

a. _P_(_P_ |_B_) = 1 − _P_(_N_ |_B_) = 1 − .02 = .98

b. _P_(_B_ AND _P_) = _P_(_P_ |_B_)_P_(_B_) = .98(.143) = .1401

c. _P_(_B'_) = 1 − _P_(_B_) = 1 − .143 = .857

d. _P_(_P_) = 1 − _P_(_N_) = 1 − .85 = .15

###  Try It  3.19

A student goes to the library. Let events _B_ = the student checks out a book and _D_ = the student checks out a DVD. Suppose that _P_(_B_) = .40, _P_(_D_) = .30, and _P_(_D_ |_B_) = .5.

  1. Find _P_(_B′_).
  2. Find _P_(_D_ AND _B_).
  3. Find _P_(_B_ |_D_).
  4. Find _P_(_D_ AND _B′_).
  5. Find _P_(_D_ |_B′_).

