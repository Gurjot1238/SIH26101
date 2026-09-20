# 3.4 Contingency Tables

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/3-4-contingency-tables
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.4 Contingency Tables

A contingency table provides a way of portraying data that can facilitate calculating probabilities. The table helps in determining conditional probabilities quite easily. The table displays sample values in relation to two different variables that may be dependent or contingent on one another. Later on, we will use contingency tables again, but in another manner.

###  Example  3.20

####  Problem

Suppose a study of speeding violations and drivers who use cell phones produced the following fictional data: 

| Speeding violation in the last year | No speeding violation in the last year | Total  
---|---|---|---  
Uses cell phone while driving | 25 | 280 | 305  
Does not use cell phone while driving | 45 | 405 | 450  
Total | 70 | 685 | 755  
  
Table  3.2

The total number of people in the sample is 755. The row totals are 305 and 450. The column totals are 70 and 685. Notice that 305 + 450 = 755 and 70 + 685 = 755.

Calculate the following probabilities using the table.  
  

a. Find _P_(Driver is a cell phone user).  
b. Find _P_(driver had no violation in the last year).  
c. Find _P_(Driver had no violation in the last year AND was a cell phone user).  
d. Find _P_(Driver is a cell phone user OR driver had no violation in the last year).  
e. Find _P_(Driver is a cell phone user GIVEN driver had a violation in the last year).  
f. Find _P_(Driver had no violation last year GIVEN driver was not a cell phone user)

####  Solution

a.  number of cell phone users total number in study = 305 755 number of cell phone users total number in study = 305 755   
  
b.  number that had no violation total number in study = 685 755 number that had no violation total number in study = 685 755   
  
c.  280 755 280 755   
  
d.  ( 305 755 + 685 755 ) − 280 755 = 710 755 ( 305 755 + 685 755 ) − 280 755 = 710 755   
  
e.  25 70 25 70 (The sample space is reduced to the number of drivers who had a violation.)  
  
f.  405 450 405 450 (The sample space is reduced to the number of drivers who were not cell phone users.)

###  Try It  3.20

[Table 3.3](<3-4-contingency-tables#M05_ch03-tbl002>) shows the number of athletes who stretch before exercising and how many had injuries within the past year. 

| Injury in last year | No injury in last year | Total  
---|---|---|---  
Stretches | 55 | 295 | 350  
Does not stretch | 231 | 219 | 450  
Total | 286 | 514 | 800  
  
Table  3.3

  1. What is _P_(athlete stretches before exercising)?
  2. What is _P_(athlete stretches before exercising|no injury in the last year)?

###  Example  3.21

[Table 3.4](<3-4-contingency-tables#M05_ch03-tbl003>) shows a random sample of 100 hikers and the areas of hiking they prefer.

Sex | The Coastline | Near Lakes and Streams | On Mountain Peaks | Total  
---|---|---|---|---  
Female | 18 | 16 |  | 45  
Male |  |  | 14 | 55  
Total |  | 41 |  |   
  
Table  3.4 Hiking Area Preference

####  Problem

a. Complete the table.

####  Solution

a. 

Sex | The Coastline | Near Lakes and Streams | On Mountain Peaks | Total  
---|---|---|---|---  
Female | 18 | 16 | **11** | 45  
Male | **16** | **25** | 14 | 55  
Total | **34** | 41 | **25** | **100**  
  
Table  3.5 Hiking Area Preference

####  Problem

b. Are the events "being female" and "preferring the coastline" independent events?

Let _F_ = being female and let _C_ = preferring the coastline.

  1. Find _P_(_F_ AND _C_).
  2. Find _P_(_F_)_P_(_C_)

Are these two numbers the same? If they are, then _F_ and _C_ are independent. If they are not, then _F_ and _C_ are not independent.

####  Solution

b.

  1. _P_(_F_ AND _C_) =  18 100 18 100 = 0.18
  2. _P_(_F_)_P_(_C_) =  ( 45 100 )( 34 100 ) ( 45 100 )( 34 100 ) = (0.45)(0.34) = 0.153

_P_(_F_ AND _C_) ≠ _P_(_F_)_P_(_C_), so the events _F_ and _C_ are not independent.  
  

####  Problem

c. Find the probability that a person is male given that the person prefers hiking near lakes and streams. Let _M_ = being male, and let _L_ = prefers hiking near lakes and streams.

  1. What word tells you this is a conditional? 
  2. Fill in the blanks and calculate the probability: _P_(___|___) = ___.
  3. Is the sample space for this problem all 100 hikers? If not, what is it?

####  Solution

c. 

  1. The word 'given' tells you that this is a conditional.
  2. _P_(_M_ |_L_) =  25 41 25 41
  3. No, the sample space for this problem is the 41 hikers who prefer lakes and streams.

  
  

####  Problem

d. Find the probability that a person is female or prefers hiking on mountain peaks. Let _F_ = being female, and let _P_ = prefers mountain peaks.

  1. Find _P_(_F_).
  2. Find _P_(_P_).
  3. Find _P_(_F_ AND _P_).
  4. Find _P_(_F_ OR _P_).

####  Solution

d. 

  1. _P_(_F_) =  45 100 45 100
  2. _P_(_P_) =  25 100 25 100
  3. _P_(_F_ AND _P_) =  11 100 11 100
  4. _P_(_F_ OR _P_) =  45 100 45 100 \+  25 100 25 100 \-  11 100 11 100 =  59 100 59 100

###  Try It  3.21

[Table 3.6](<3-4-contingency-tables#M05_ch03-tbl005>) shows a random sample of 200 cyclists and the routes they prefer. Let _M_ = males and _H_ = hilly path. 

Gender | Lake Path | Hilly Path | Wooded Path | Total  
---|---|---|---|---  
Female | 45 | 38 | 27 | 110  
Male | 26 | 52 | 12 | 90  
Total | 71 | 90 | 39 | 200  
  
Table  3.6

  1. Out of the males, what is the probability that the cyclist prefers a hilly path?
  2. Are the events “being male” and “preferring the hilly path” independent events?

###  Example  3.22

Muddy Mouse lives in a cage with three doors. If Muddy goes out the first door, the probability that he gets caught by Alissa the cat is  1 5 1 5 and the probability he is not caught is  4 5 4 5 . If he goes out the second door, the probability he gets caught by Alissa is  1 4 1 4 and the probability he is not caught is  3 4 3 4 . The probability that Alissa catches Muddy coming out of the third door is  1 2 1 2 and the probability she does not catch Muddy is  1 2 1 2 . It is equally likely that Muddy will choose any of the three doors so the probability of choosing each door is  1 3 1 3 .

Caught or Not | Door One | Door Two | Door Three | Total  
---|---|---|---|---  
Caught |  1 15 1 15 |  1 12 1 12 |  1 6 1 6 |   
Not Caught |  4 15 4 15 |  3 12 3 12 |  1 6 1 6 |   
Total |  |  |  | 1  
  
Table  3.7 Door Choice

  * The first entry  1 15 = ( 1 5 ) ( 1 3 ) 1 15 = ( 1 5 )( 1 3 ) is _P_(Door One AND Caught)
  * The entry  4 15 = ( 4 5 )( 1 3 ) 4 15 =( 4 5 )( 1 3 ) is _P_(Door One AND Not Caught)

Verify the remaining entries.  
  

####  Problem

a. Complete the probability contingency table. Calculate the entries for the totals. Verify that the lower-right corner entry is 1.

b. What is the probability that Alissa does not catch Muddy?

c. What is the probability that Muddy chooses Door One OR Door Two given that Muddy is caught by Alissa?

####  Solution

a. 

Caught or Not | Door One | Door Two | Door Three | Total  
---|---|---|---|---  
Caught |  1 15 1 15 |  1 12 1 12 |  1 6 1 6 | **19 601960**  
Not Caught |  4 15 4 15 |  3 12 3 12 |  1 6 1 6 | **41 604160**  
Total | **5 15515** | **4 12412** | **2 626** | 1  
  
Table  3.8 Door Choice

b. 41604160  
  

c. 919919

###  Example  3.23

[Table 3.9](<3-4-contingency-tables#Ch03_M04_tbl007>) contains the number of crimes per 100,000 inhabitants from 2008 to 2011 in the U.S.

Year | Robbery | Burglary | Rape | Vehicle | Total  
---|---|---|---|---|---  
2008 | 145.7 | 732.1 | 29.7 | 314.7 |   
2009 | 133.1 | 717.7 | 29.1 | 259.2 |   
2010 | 119.3 | 701 | 27.7 | 239.1 |   
2011 | 113.7 | 702.2 | 26.8 | 229.6 |   
Total |  |  |  |  |   
  
Table  3.9 United States Crime Index Rates Per 100,000 Inhabitants 2008–2011

####  Problem

TOTAL each column and each row. Total data = 4,520.7

  1. Find _P_(2009 AND Robbery).
  2. Find _P_(2010 AND Burglary).
  3. Find _P_(2010 OR Burglary).
  4. Find _P_(2011|Rape).
  5. Find _P_(Vehicle|2008).

####  Solution

a. 0.0294, b. 0.1551, c. 0.7165, d. 0.2365, e. 0.2575

###  Try It  3.23

[Table 3.10](<3-4-contingency-tables#M05_ch03-tbl009>) relates the weights and heights of a group of individuals participating in an observational study.

Weight/Height | Tall | Medium | Short | Totals  
---|---|---|---|---  
Obese | 18 | 28 | 14 |   
Normal | 20 | 51 | 28 |   
Underweight | 12 | 25 | 9 |   
Totals |  |  |  |   
  
Table  3.10

  1. Find the total for each row and column
  2. Find the probability that a randomly chosen individual from this group is Tall.
  3. Find the probability that a randomly chosen individual from this group is Obese and Tall.
  4. Find the probability that a randomly chosen individual from this group is Tall given that the idividual is Obese.
  5. Find the probability that a randomly chosen individual from this group is Obese given that the individual is Tall.
  6. Find the probability a randomly chosen individual from this group is Tall and Underweight.
  7. Are the events Obese and Tall independent?

