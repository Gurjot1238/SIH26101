# 3.3 Two Basic Rules of Probability

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/3-3-two-basic-rules-of-probability
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.3 Two Basic Rules of Probability

When calculating probability, there are two rules to consider when determining if two events are independent or dependent and if they are mutually exclusive or not.

### The Multiplication Rule

If _A_ and _B_ are two events defined on a sample space, then: _P_(_A_ AND _B_) = _P_(_B_)_P_(_A_ |_B_).

This rule may also be written as: _P_(_A_ |_B_) =  P(A AND B) P(B) P(A AND B) P(B)

(The probability of _A_ given _B_ equals the probability of _A_ and _B_ divided by the probability of _B_.)

If _A_ and _B_ are independent, then _P_(_A_ |_B_) = _P_(_A_). Then _P_(_A_ AND _B_) = _P_(_A_ |_B_)_P_(_B_) becomes _P_(_A_ AND _B_) = _P_(_A_)_P_(_B_).

### The Addition Rule

If _A_ and _B_ are defined on a sample space, then: _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) - _P_(_A_ AND _B_).

If _A_ and _B_ are mutually exclusive, then _P_(_A_ AND _B_) = 0. Then _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) - _P_(_A_ AND _B_) becomes _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_).

###  Example  3.14

Klaus is trying to choose where to go on vacation. His two choices are: _A_ = New Zealand and _B_ = Alaska

  * Klaus can only afford one vacation. The probability that he chooses _A_ is _P_(_A_) = 0.6 and the probability that he chooses _B_ is _P_(_B_) = 0.35.
  * _P_(_A_ AND _B_) = 0 because Klaus can only afford to take one vacation
  * Therefore, the probability that he chooses either New Zealand or Alaska is _P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) = 0.6 + 0.35 = 0.95. Note that the probability that he does not choose to go anywhere on vacation must be 0.05.

###  Example  3.15

Carlos plays college soccer. He makes a goal 65% of the time he shoots. Carlos is going to attempt two goals in a row in the next game. _A_ = the event Carlos is successful on his first attempt. _P_(_A_) = 0.65. _B_ = the event Carlos is successful on his second attempt. _P_(_B_) = 0.65. Carlos tends to shoot in streaks. The probability that he makes the second goal **GIVEN** that he made the first goal is 0.90.  
  

####  Problem

a. What is the probability that he makes both goals?

b. What is the probability that Carlos makes either the first goal or the second goal?

c. Are _A_ and _B_ independent?

d. Are _A_ and _B_ mutually exclusive?

####  Solution

a. The problem is asking you to find _P_(_A_ AND _B_) = _P_(_B_ AND _A_). Since _P_(_B_ |_A_) = 0.90: _P_(_B_ AND _A_) = _P_(_B_ |_A_) _P_(_A_) = (0.90)(0.65) = 0.585

Carlos makes the first and second goals with probability 0.585.  
  

b. The problem is asking you to find _P_(_A_ OR _B_).

_P_(_A_ OR _B_) = _P_(_A_) + _P_(_B_) - _P_(_A_ AND _B_) = 0.65 + 0.65 - 0.585 = 0.715

Carlos makes either the first goal or the second goal with probability 0.715.  
  

c. No, they are not, because _P_(_B_ AND _A_) = 0.585.

_P_(_B_)_P_(_A_) = (0.65)(0.65) = 0.423

0.423 ≠ 0.585 = _P_(_B_ AND _A_)

So, _P_(_B_ AND _A_) is **not** equal to _P_(_B_)_P_(_A_).  
  

d. No, they are not because _P_(_A_ and _B_) = 0.585.

To be mutually exclusive, _P_(_A_ AND _B_) must equal zero.

###  Try It  3.15

Helen plays basketball. For free throws, she makes the shot 75% of the time. Helen must now attempt two free throws. _C_ = the event that Helen makes the first shot. _P_(_C_) = 0.75. _D_ = the event Helen makes the second shot. _P_(_D_) = 0.75. The probability that Helen makes the second free throw given that she made the first is 0.85. What is the probability that Helen makes both free throws?

###  Example  3.16

A community swim team has **150** members. **Seventy-five** of the members are advanced swimmers. **Forty-seven** of the members are intermediate swimmers. The remainder are novice swimmers. **Forty** of the advanced swimmers practice four times a week. **Thirty** of the intermediate swimmers practice four times a week. **Ten** of the novice swimmers practice four times a week. Suppose one member of the swim team is chosen randomly.  
  

####  Problem

a. What is the probability that the member is a novice swimmer?

b. What is the probability that the member practices four times a week?

c. What is the probability that the member is an advanced swimmer and practices four times a week?

d. What is the probability that a member is an advanced swimmer and an intermediate swimmer? Are being an advanced swimmer and an intermediate swimmer mutually exclusive? Why or why not?

e. Are being a novice swimmer and practicing four times a week independent events? Why or why not?

####  Solution

a. 2815028150  
  

b. 8015080150  
  

c. 4015040150  
  

d. _P_(advanced AND intermediate) = 0, so these are mutually exclusive events. A swimmer cannot be an advanced swimmer and an intermediate swimmer at the same time.  
  

e. No, these are not independent events.   
_P_(novice AND practices four times per week) = 0.0667   
_P_(novice)_P_(practices four times per week) = 0.0996   
0.0667 ≠ 0.0996

###  Try It  3.16

A school has 200 seniors of whom 140 will be going to college next year. Forty will be going directly to work. The remainder are taking a gap year. Fifty of the seniors going to college play sports. Thirty of the seniors going directly to work play sports. Five of the seniors taking a gap year play sports. What is the probability that a senior is taking a gap year?

###  Example  3.17

Felicity attends Modesto JC in Modesto, CA. The probability that Felicity enrolls in a math class is 0.2 and the probability that she enrolls in a speech class is 0.65. The probability that she enrolls in a math class GIVEN that she enrolls in speech class is 0.25.

Let: _M_ = math class, _S_ = speech class, _M_ |_S_ = math given speech

####  Problem

  1. What is the probability that Felicity enrolls in math and speech?   
Find _P_(_M_ AND _S_) = _P_(_M_ |_S_)_P_(_S_).
  2. What is the probability that Felicity enrolls in math or speech classes?   
Find _P_(_M_ OR _S_) = _P_(_M_) + _P_(_S_) - _P_(_M_ AND _S_).
  3. Are _M_ and _S_ independent? Is _P_(_M_ |_S_) = _P_(_M_)?
  4. Are _M_ and _S_ mutually exclusive? Is _P_(_M_ AND _S_) = 0?

####  Solution

a. 0.1625, b. 0.6875, c. No, d. No

###  Try It  3.17

A student goes to the library. Let events _B_ = the student checks out a book and _D_ = the student checks out a DVD. Suppose that _P_(_B_) = 0.40, _P_(_D_) = 0.30 and _P_(_D_ |_B_) = 0.5.

  1. Find _P_(_B_ AND _D_).
  2. Find _P_(_B_ OR _D_).

###  Example  3.18

Studies show that about one woman in seven (approximately 14.3%) who live to be 90 will develop breast cancer. Suppose that of those women who develop breast cancer, a test is negative 2% of the time. Also suppose that in the general population of women, the test for breast cancer is negative about 85% of the time. Let _B_ = woman develops breast cancer and let _N_ = tests negative. Suppose one woman is selected at random.  
  

####  Problem

a. What is the probability that the woman develops breast cancer? What is the probability that woman tests negative?

b. Given that the woman has breast cancer, what is the probability that she tests negative?

c. What is the probability that the woman has breast cancer AND tests negative?

d. What is the probability that the woman has breast cancer or tests negative?

e. Are having breast cancer and testing negative independent events?

f. Are having breast cancer and testing negative mutually exclusive?

####  Solution

a. _P_(_B_) = 0.143; _P_(_N_) = 0.85  
  

b. _P_(_N_ |_B_) = 0.02  
  

c. _P_(_B_ AND _N_) = _P_(_B_)_P_(_N_ |_B_) = (0.143)(0.02) = 0.0029  
  

d. _P_(_B_ OR _N_) = _P_(_B_) + _P_(_N_) - _P_(_B_ AND _N_) = 0.143 + 0.85 - 0.0029 = 0.9901  
  

e. No. _P_(_N_) = 0.85; _P_(_N_ |_B_) = 0.02. So, _P_(_N_ |_B_) does not equal _P_(_N_).  
  

f. No. _P_(_B_ AND _N_) = 0.0029. For _B_ and _N_ to be mutually exclusive, _P_(_B_ AND _N_) must be zero.

###  Try It  3.18

A school has 200 seniors of whom 140 will be going to college next year. Forty will be going directly to work. The remainder are taking a gap year. Fifty of the seniors going to college play sports. Thirty of the seniors going directly to work play sports. Five of the seniors taking a gap year play sports. What is the probability that a senior is going to college and plays sports?

###  Example  3.19

####  Problem

Refer to the information in [Example 3.18](<3-3-two-basic-rules-of-probability#example5>). _P_ = tests positive.

  1. Given that a woman develops breast cancer, what is the probability that she tests positive. Find _P_(_P_ |_B_) = 1 - _P_(_N_ |_B_).
  2. What is the probability that a woman develops breast cancer and tests positive. Find _P_(_B_ AND _P_) = _P_(_P_ |_B_)_P_(_B_).
  3. What is the probability that a woman does not develop breast cancer. Find _P_(_B′_) = 1 - _P_(_B_).
  4. What is the probability that a woman tests positive for breast cancer. Find _P_(_P_) = 1 - _P_(_N_).

####  Solution

a. 0.98; b. 0.1401; c. 0.857; d. 0.15

###  Try It  3.19

A student goes to the library. Let events _B_ = the student checks out a book and _D_ = the student checks out a DVD. Suppose that _P_(_B_) = 0.40, _P_(_D_) = 0.30 and _P_(_D_ |_B_) = 0.5.

  1. Find _P_(_B′_).
  2. Find _P_(_D_ AND _B_).
  3. Find _P_(_B_ |_D_).
  4. Find _P_(_D_ AND _B′_).
  5. Find _P_(_D_ |_B′_).

