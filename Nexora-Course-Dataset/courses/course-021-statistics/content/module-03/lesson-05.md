# 3.4 Contingency Tables

> Source: Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/statistics/pages/3-4-contingency-tables
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.4 Contingency Tables

A two-way table provides a way of portraying data that can facilitate calculating probabilities. When used to calculate probabilities, a two-way table is often called a contingency table. The table helps in determining conditional probabilities quite easily. The table displays sample values in relation to two different variables that may be dependent or contingent on one another. We used two-way tables in Chapters 1 and 2 to calculate marginal and conditional distributions. These tables organize data in a way that supports the calculation of relative frequency and, therefore, experimental (empirical) probability. Later on, we will use contingency tables again, but in another manner.

###  Example  3.20

Suppose a study of speeding violations and drivers who use cell phones produced the following fictional data: 

| Speeding Violation in the Last Year | No Speeding Violation in the Last Year | Total  
---|---|---|---  
Uses a cell phone while driving | 25 | 280 | 305  
Does not use a cell phone while driving | 45 | 405 | 450  
Total | 70 | 685 | 755  
  
Table  3.3

The total number of people in the sample is 755. The row totals are 305 and 450. The column totals are 70 and 685. Notice that 305 + 450 = 755 and 70 + 685 = 755.

Using the table, calculate the following probabilities:  
  

####  Problem

  1. Find _P_(Person uses a cell phone while driving).
  2. Find _P_(Person had no violation in the last year).
  3. Find _P_(Person had no violation in the last year _and_ uses a cell phone while driving).
  4. Find _P_(Person uses a cell phone while driving _or_ person had no violation in the last year).
  5. Find _P_(Person uses a cell phone while driving _given_ person had a violation in the last year).
  6. Find _P_(Person had no violation last year _given_ person does not use a cell phone while driving).

####  Solution

a. This is the same as the marginal distribution ([Section 1.2](<1-2-data-sampling-and-variation-in-data-and-sampling>)).

P( Person uses a cell phone while driving )= number who use cell phones while driving number in study = 305 755 ≈.4040 P( Person uses a cell phone while driving )= number who use cell phones while driving number in study = 305 755 ≈.4040

3.5

b. The marginal distribution is

P( Person had no violation in the last year )= number who had no violation number in study = 685 755 ≈.9073 . P( Person had no violation in the last year )= number who had no violation number in study = 685 755 ≈.9073 .

3.6

c. Find the number of participants who satisfy _both_ conditions.

P(Person had no violation in the last year AND uses a cell phone while driving)= number who had no violation AND uses cell phone while driving number in study = 280 755 ≈.3709 P(Person had no violation in the last year AND uses a cell phone while driving)= number who had no violation AND uses cell phone while driving number in study = 280 755 ≈.3709

3.7

d. To find this probability, you need to identify how many participants use a cell phone while driving OR have no violation in the past year OR both.

P( Person uses a cell phone while drivingORhad no violation in the last year ) = 25+405+280 755 P( Person uses a cell phone while drivingORhad no violation in the last year ) = 25+405+280 755

= 710 755 ≈.9404 = 710 755 ≈.9404

3.8

e. This is a conditional probability. You are _given_ that the person had no violation in the last year, so you need only consider the values in that column of data.

(Person uses a cell phone while driving GIVEN the person had a violation in the last year)= number who used cell phone AND ​had a violation number in study who had a violation in the last year = 25 70 ≈.3571 (Person uses a cell phone while driving GIVEN the person had a violation in the last year)= number who used cell phone AND ​had a violation number in study who had a violation in the last year = 25 70 ≈.3571

3.9

f. For this conditional probability, consider only values in the row labeled “Does not use a cell phone while driving.”

P( Person had no violation last yearGIVENperson does not use cell phone while driving )= 405 450 =.9 P( Person had no violation last yearGIVENperson does not use cell phone while driving )= 405 450 =.9

###  Try It  3.20

[Table 3.4](<3-4-contingency-tables#M05_ch03-tbl002>) shows the number of athletes who stretch before exercising and how many had injuries within the past year. 

| Injury in Past Year | No Injury in Past Year | Total  
---|---|---|---  
Stretches | 55 | 295 | 350  
Does not stretch | 231 | 219 | 450  
Total | 286 | 514 | 800  
  
Table  3.4

  1. What is _P_(Athlete stretches before exercising)?
  2. What is _P_(Athlete stretches before exercising|no injury in the last year)?

###  Example  3.21

[Table 3.5](<3-4-contingency-tables#M05_ch03-tbl003>) shows a random sample of 100 hikers and the areas of hiking they prefer.

Sex | The Coastline | Near Lakes and Streams | On Mountain Peaks | Total  
---|---|---|---|---  
Female | 18 | 16 | ___ | 45  
Male | ___ | ___ | 14 | 55  
Total | ___ | 41 | ___ | ___  
  
Table  3.5 Hiking Area Preference

####  Problem

a. Complete the table.

####  Solution

a. There are 45 females in the sample; 18 prefer the coastline and 16 prefer hiking near lakes and streams. So, we know there are 45 − 18 − 16 = 11 female students who prefer hiking on mountain peaks.

Continue reasoning in this way to complete the table. 

Sex | The Coastline | Near Lakes and Streams | On Mountain Peaks | Total  
---|---|---|---|---  
Female | 18 | 16 | **11** | 45  
Male | **16** | **25** | 14 | 55  
Total | **34** | 41 | **25** | **100**  
  
Table  3.6 Hiking Area Preference

####  Problem

b. Are the events _being female_ and _preferring the coastline_ independent events?

Let _F_ = being female and let _C_ = preferring the coastline.

  1. Find _P_(_F_ AND _C_).
  2. Find _P_(_F_)_P_(_C_).

Are these two numbers the same? If they are, then _F_ and _C_ are independent. If they are not, then _F_ and _C_ are not independent.

####  Solution

b.

  1. _P_(_F_ AND _C_) =  18 100 18 100 = .18
  2. _P_(_F_)_P_(_C_) =  ( 45 100 )( 34 100 ) ( 45 100 )( 34 100 ) = (.45)(.34) = .153

_P_(_F_ AND _C_) ≠ _P_(_F_)_P_(_C_), so the events _F_ and _C_ are not independent.  
  

####  Problem

c. Find the probability that a person is male given that the person prefers hiking near lakes and streams. Let _M_ = being male, and let _L_ = prefers hiking near lakes and streams.

  1. What word tells you this is a conditional? 
  2. Is the sample space for this problem all 100 hikers? If not, what is it?
  3. Fill in the blanks and calculate the probability: _P_(_____|_____) = _____.

####  Solution

c. 

  1. The word _given_ tells you that this is a conditional.
  2. No, the sample space for this problem is the 41 hikers who prefer lakes and streams.
  3. Find the conditional probability _P_(_M_ |_L_). Because it is given that the person prefers hiking near lakes and streams, you need only consider the values in the column labeled "Near Lakes and Streams." _P_(_M_ |_L_) =  25 41 25 41

  
  

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
  3. _P_(_F_ AND _P_) =  number of hikers that are both female AND prefers mountain peaks number of hikers in study number of hikers that are both female AND prefers mountain peaks number of hikers in study =  11 100 11 100
  4. _P_(_F_ OR _P_) = _P_(_F_) + _P_(_P_) − _P_(_F_ AND _P_) =  45 100 45 100 \+  25 100 25 100 \-  11 100 11 100 =  59 100 59 100

###  Try It  3.21

[Table 3.7](<3-4-contingency-tables#M05_ch03-tbl005>) shows a random sample of 200 cyclists and the routes they prefer. Let _M_ = males and _H_ = hilly path. 

Gender | Lake Path | Hilly Path | Wooded Path | Total  
---|---|---|---|---  
Female | 45 | 38 | 27 | 110  
Male | 26 | 52 | 12 | 90  
Total | 71 | 90 | 39 | 200  
  
Table  3.7

  1. Out of the males, what is the probability that the cyclist prefers a hilly path?
  2. Are the events _being male_ and _preferring the hilly path_ independent events?

###  Example  3.22

Muddy Mouse lives in a cage with three doors. If Muddy goes out the first door, the probability that he gets caught by Alissa the cat is  1 5 1 5 and the probability he is not caught is  4 5 4 5 . If he goes out the second door, the probability he gets caught by Alissa is  1 4 1 4 and the probability he is not caught is  3 4 3 4 . The probability that Alissa catches Muddy coming out of the third door is  1 2 1 2 and the probability she does not catch Muddy is  1 2 1 2 . It is equally likely that Muddy will choose any of the three doors, so the probability of choosing each door is  1 3 1 3 .

Caught or Not | Door One | Door Two | Door Three | Total  
---|---|---|---|---  
Caught |  1 15 1 15 |  1 12 1 12 |  1 6 1 6 | ____  
Not Caught |  4 15 4 15 |  3 12 3 12 |  1 6 1 6 | ____  
Total | ____ | ____ | ____ | 1  
  
Table  3.8 Door Choice

  * The first entry  1 15 = ( 1 5 ) ( 1 3 ) 1 15 = ( 1 5 )( 1 3 ) is _P_(Door One AND Caught).
  * The entry  4 15 = ( 4 5 )( 1 3 ) 4 15 =( 4 5 )( 1 3 ) is _P_(Door One AND Not Caught).

Verify the remaining entries.  
  

####  Problem

a. Complete the probability contingency table. Calculate the entries for the totals. Verify that the lower-right corner entry is 1.

####  Solution

a. 

Caught or Not | Door One | Door Two | Door Three | Total  
---|---|---|---|---  
Caught |  1 15 1 15 |  1 12 1 12 |  1 6 1 6 | **19 601960**  
Not Caught |  4 15 4 15 |  3 12 3 12 |  1 6 1 6 | **41 604160**  
Total | **5 15515** | **4 12412** | **2 626** | 1  
  
Table  3.9 Door Choice

####  Problem

b. What is the probability that Alissa does not catch Muddy?

####  Solution

b. 41604160  
  

####  Problem

c. What is the probability that Muddy chooses Door One OR Door Two given that Muddy is caught by Alissa?

####  Solution

c. This is a conditional probability, so consider only probabilities in the row labeled "Caught." Choosing Door One and choosing Door Two are mutually exclusive, so

P( Choosing Door One OR Choosing Door Two AND Caught )= 1 15 + 1 12 = 9 60 . P( Choosing Door One OR Choosing Door Two AND Caught )= 1 15 + 1 12 = 9 60 .

Use the formula for conditional probability  P(A|B)= P( A AND B ) P( B ) . P(A|B)= P( A AND B ) P( B ) .

P( Door One OR Door Two|Caught )= P( Door One OR Door Two AND Caught ) P( Caught ) = 9 60 19 60 = 9 19. . P( Door One OR Door Two|Caught )= P( Door One OR Door Two AND Caught ) P( Caught ) = 9 60 19 60 = 9 19. .

###  Example  3.23

[Table 3.10](<3-4-contingency-tables#Ch03_M04_tbl007>) contains the number of crimes per 100,000 inhabitants from 2008 to 2011 in the United States.

Year | Crime A | Crime B | Crime C | Crime D | Total  
---|---|---|---|---|---  
2008 | 145.7 | 732.1 | 29.7 | 314.7 |   
2009 | 133.1 | 717.7 | 29.1 | 259.2 |   
2010 | 119.3 | 701 | 27.7 | 239.1 |   
2011 | 113.7 | 702.2 | 26.8 | 229.6 |   
Total |  |  |  |  |   
  
Table  3.10 U.S. Crime Index Rates Per 100,000 Inhabitants 2008–2011

####  Problem

TOTAL each column and each row. Total data = 4,520.7.

  1. Find _P_(2009 AND Crime A).
  2. Find _P_(2010 AND Crime B).
  3. Find _P_(2010 OR Crime B).
  4. Find _P_(2011|Crime A).
  5. Find _P_(Crime D|2008).

####  Solution

a.  133.1 4,520.7 133.1 4,520.7 = .0294, b.  701 4,520.7 701 4,520.7 = .1551, c. _P_(2010 OR Crime B) = _P_(2010) + _P_(Crime B) – _P_(2010 AND Crime B) =  1,087.1 4,520.7 1,087.1 4,520.7 \+  2,852.9 4,520.7 2,852.9 4,520.7 −  701 4,520.7 701 4,520.7 = .7165, d.  113.7 511.8 113.7 511.8 = .2222, e.  314.7 1,222.2 314.7 1,222.2 = .2575

###  Try It  3.23

[Table 3.11](<3-4-contingency-tables#M05_ch03-tbl009>) relates the weights and heights of a group of individuals participating in an observational study.

Ages | Tall | Medium | Short | Totals  
---|---|---|---|---  
Under 18 | 18 | 28 | 14 |   
18–50 | 20 | 51 | 28 |   
51+ | 12 | 25 | 9 |   
Totals |  |  |  |   
  
Table  3.11

  1. Find the total for each row and column.
  2. Find the probability that a randomly chosen individual from this group is tall.
  3. Find the probability that a randomly chosen individual from this group is Under 18 and tall.
  4. Find the probability that a randomly chosen individual from this group is tall given that the individual is Under 18.
  5. Find the probability that a randomly chosen individual from this group is Under 18 given that the individual is tall.
  6. Find the probability a randomly chosen individual from this group is tall and age 51+.
  7. Are the events under 18 and tall independent?

