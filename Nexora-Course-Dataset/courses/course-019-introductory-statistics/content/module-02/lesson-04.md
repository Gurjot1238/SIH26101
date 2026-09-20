# 2.3 Measures of the Location of the Data

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/2-3-measures-of-the-location-of-the-data
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 2.3 Measures of the Location of the Data

The common measures of location are quartiles and percentiles

Quartiles are special percentiles. The first quartile, _Q_ 1, is the same as the 25th percentile, and the third quartile, _Q_ 3, is the same as the 75th percentile. The median, _M_ , is called both the second quartile and the 50th percentile.

To calculate quartiles and percentiles, the data must be ordered from smallest to largest. Quartiles divide ordered data into quarters. Percentiles divide ordered data into hundredths. To score in the 90th percentile of an exam does not mean, necessarily, that you received 90% on a test. It means that 90% of test scores are the same or less than your score and 10% of the test scores are the same or greater than your test score.

Percentiles are useful for comparing values. For this reason, universities and colleges use percentiles extensively. One instance in which colleges and universities use percentiles is when SAT results are used to determine a minimum testing score that will be used as an acceptance factor. For example, suppose Duke accepts SAT scores at or above the 75th percentile. That translates into a score of at least 1220.

Percentiles are mostly used with very large populations. Therefore, if you were to say that 90% of the test scores are less (and not the same or less) than your score, it would be acceptable because removing one particular data value is not significant. 

The median is a number that measures the "center" of the data. You can think of the median as the "middle value," but it does not actually have to be one of the observed values. It is a number that separates ordered data into halves. Half the values are the same number or smaller than the median, and half the values are the same number or larger. For example, consider the following data.   
1; 11.5; 6; 7.2; 4; 8; 9; 10; 6.8; 8.3; 2; 2; 10; 1   
Ordered from smallest to largest:   
1; 1; 2; 2; 4; 6; 6.8; 7.2; 8; 8.3; 9; 10; 10; 11.5

Since there are 14 observations, the median is between the seventh value, 6.8, and the eighth value, 7.2. To find the median, add the two values together and divide by two.

6.8+7.2=1414÷2=76.8+7.2=1414÷2=7

The median is seven. Half of the values are smaller than seven and half of the values are larger than seven.

Quartiles are numbers that separate the data into quarters. Quartiles may or may not be part of the data. To find the quartiles, first find the median or second quartile. The first quartile, _Q_ 1, is the middle value of the lower half of the data, and the third quartile, _Q_ 3, is the middle value, or median, of the upper half of the data. To get the idea, consider the same data set:   
1; 1; 2; 2; 4; 6; 6.8; 7.2; 8; 8.3; 9; 10; 10; 11.5

The median or **second quartile** is seven. The lower half of the data are 1, 1, 2, 2, 4, 6, 6.8. The middle value of the lower half is two.   
1; 1; 2; 2; 4; 6; 6.8 

The number two, which is part of the data, is the first quartile. One-fourth of the entire sets of values are the same as or less than two and three-fourths of the values are more than two.

The upper half of the data is 7.2, 8, 8.3, 9, 10, 10, 11.5. The middle value of the upper half is nine.

The third quartile, _Q_ 3, is nine. Three-fourths (75%) of the ordered data set are less than nine. One-fourth (25%) of the ordered data set are greater than nine. The third quartile is part of the data set in this example.

The interquartile range is a number that indicates the spread of the middle half or the middle 50% of the data. It is the difference between the third quartile (_Q_ 3) and the first quartile (_Q_ 1).

_IQR_ = _Q_ 3 – _Q_ 1

The _IQR_ can help to determine potential **outliers**. **A value is suspected to be a potential outlier if it is less than (1.5)(_IQR_) below the first quartile or more than (1.5)(_IQR_) above the third quartile**. Potential outliers always require further investigation.

###  NOTE

A potential outlier is a data point that is significantly different from the other data points. These special data points may be errors or some kind of abnormality or they may be a key to understanding the data.

###  Example  2.13

####  Problem

For the following 13 real estate prices, calculate the _IQR_ and determine if any prices are potential outliers. Prices are in dollars.   
389,950; 230,500; 158,000; 479,000; 639,000; 114,950; 5,500,000; 387,000; 659,000; 529,000; 575,000; 488,800; 1,095,000

####  Solution

Order the data from smallest to largest.   
114,950; 158,000; 230,500; 387,000; 389,950; 479,000; 488,800; 529,000; 575,000; 639,000; 659,000; 1,095,000; 5,500,000

 _M_ = 488,800

 _Q_ 1 =  230,500 + 387,000 2 230,500 + 387,000 2 = 308,750

 _Q_ 3 =  639,000 + 659,000 2 639,000 + 659,000 2 = 649,000

 _IQR_ = 649,000 – 308,750 = 340,250

(1.5)(_IQR_) = (1.5)(340,250) = 510,375

 _Q_ 1 – (1.5)(_IQR_) = 308,750 – 510,375 = –201,625

 _Q_ 3 \+ (1.5)(_IQR_) = 649,000 + 510,375 = 1,159,375

No house price is less than –201,625. However, 5,500,000 is more than 1,159,375. Therefore, 5,500,000 is a potential outlier.

###  Try It  2.13

For the following 11 salaries, calculate the _IQR_ and determine if any salaries are outliers. The salaries are in dollars.

$33,000;  $64,500;  $28,000;  $54,000;  $72,000;  $68,500;  $69,000;  $42,000;  $54,000;  $120,000;  $40,500

###  Example  2.14

####  Problem

For the two data sets in the [test scores example](<2-4-box-plots>), find the following:

  1. The interquartile range. Compare the two interquartile ranges.
  2. Any outliers in either set.

####  Solution

The five number summary for the day and night classes is

| Minimum | _Q_ 1 | Median | _Q_ 3 | Maximum  
---|---|---|---|---|---  
**Day** | 32 | 56 | 74.5 | 82.5 | 99  
**Night** | 25.5 | 78 | 81 | 89 | 98  
  
Table  2.21

  1. The IQR for the day group is _Q_ 3 – _Q_ 1 = 82.5 – 56 = 26.5 

The IQR for the night group is _Q_ 3 – _Q_ 1 = 89 – 78 = 11

The interquartile range (the spread or variability) for the day class is larger than the night class _IQR_. This suggests more variation will be found in the day class’s class test scores.

  2. Day class outliers are found using the IQR times 1.5 rule. So, 
     * _Q_ 1 \- _IQR_(1.5) = 56 – 26.5(1.5) = 16.25
     * _Q_ 3 \+ _IQR_(1.5) = 82.5 + 26.5(1.5) = 122.25

Since the minimum and maximum values for the day class are greater than 16.25 and less than 122.25, there are no outliers.

Night class outliers are calculated as:

     * _Q_ 1 – _IQR_ (1.5) = 78 – 11(1.5) = 61.5
     * _Q_ 3 \+ IQR(1.5) = 89 + 11(1.5) = 105.5

For this class, any test score less than 61.5 is an outlier. Therefore, the scores of 45 and 25.5 are outliers. Since no test score is greater than 105.5, there is no upper end outlier.

###  Try It  2.14

Find the interquartile range for the following two data sets and compare them.

Test Scores for Class _A_   
69; 96; 81; 79; 65; 76; 83; 99; 89; 67; 90; 77; 85; 98; 66; 91; 77; 69; 80; 94   
Test Scores for Class _B_   
90; 72; 80; 92; 90; 97; 92; 75; 79; 68; 70; 80; 99; 95; 78; 73; 71; 68; 95; 100

###  Example  2.15

Fifty statistics students were asked how much sleep they get per school night (rounded to the nearest hour). The results were:

AMOUNT OF SLEEP PER SCHOOL NIGHT (HOURS) | FREQUENCY | RELATIVE FREQUENCY | CUMULATIVE RELATIVE FREQUENCY  
---|---|---|---  
4 | 2 | 0.04 | 0.04  
5 | 5 | 0.10 | 0.14  
6 | 7 | 0.14 | 0.28  
7 | 12 | 0.24 | 0.52  
8 | 14 | 0.28 | 0.80  
9 | 7 | 0.14 | 0.94  
10 | 3 | 0.06 | 1.00  
  
Table  2.22

**Find the 28 th percentile**. Notice the 0.28 in the "cumulative relative frequency" column. Twenty-eight percent of 50 data values is 14 values. There are 14 values less than the 28th percentile. They include the two 4s, the five 5s, and the seven 6s. The 28th percentile is between the last six and the first seven. **The 28 th percentile is 6.5.**

**Find the median**. Look again at the "cumulative relative frequency" column and find 0.52. The median is the 50th percentile or the second quartile. 50% of 50 is 25. There are 25 values less than the median. They include the two 4s, the five 5s, the seven 6s, and eleven of the 7s. The median or 50th percentile is between the 25th, or seven, and 26th, or seven, values. **The median is seven.**

**Find the third quartile**. The third quartile is the same as the 75th percentile. You can "eyeball" this answer. If you look at the "cumulative relative frequency" column, you find 0.52 and 0.80. When you have all the fours, fives, sixes and sevens, you have 52% of the data. When you include all the 8s, you have 80% of the data. **The 75 th percentile, then, must be an eight**. Another way to look at the problem is to find 75% of 50, which is 37.5, and round up to 38. The third quartile, _Q_ 3, is the 38th value, which is an eight. You can check this answer by counting the values. (There are 37 values below the third quartile and 12 values above.)

###  Try It  2.15

Forty bus drivers were asked how many hours they spend each day running their routes (rounded to the nearest hour). Find the 65th percentile.

Amount of time spent on route (hours) | Frequency | Relative Frequency | Cumulative Relative Frequency  
---|---|---|---  
2| 12| 0.30| 0.30  
3| 14| 0.35| 0.65  
4| 10| 0.25| 0.90  
5| 4| 0.10| 1.00  
  
Table  2.23

###  Example  2.16

####  Problem

Using [Table 2.22](<2-3-measures-of-the-location-of-the-data#id4431204>):

  1. Find the 80th percentile.
  2. Find the 90th percentile.
  3. Find the first quartile. What is another name for the first quartile?

####  Solution

Using the data from the frequency table, we have:

  1. The 80th percentile is between the last eight and the first nine in the table (between the 40th and 41st values). Therefore, we need to take the mean of the 40th an 41st values. The 80th percentile  = 8+9 2 =8.5 = 8+9 2 =8.5
  2. The 90th percentile will be the 45th data value (location is 0.90(50) = 45) and the 45th data value is nine.
  3. _Q_ 1 is also the 25th percentile. The 25th percentile location calculation: _P_ 25 = 0.25(50) = 12.5 ≈ 13 the 13th data value. Thus, the 25th percentile is six.

###  Try It  2.16

Refer to the [Table 2.23](<2-3-measures-of-the-location-of-the-data#fs-idm24649760>). Find the third quartile. What is another name for the third quartile?

###  Collaborative Exercise

Your instructor or a member of the class will ask everyone in class how many sweaters they own. Answer the following questions: 

  1. How many students were surveyed?
  2. What kind of sampling did you do?
  3. Construct two different histograms. For each, starting value = _____ ending value = ____. 
  4. Find the median, first quartile, and third quartile.
  5. Construct a table of the data to find the following: 
     1. the 10th percentile
     2. the 70th percentile
     3. the percent of students who own less than four sweaters

### A Formula for Finding the _k_ th Percentile

If you were to do a little research, you would find several formulas for calculating the _k_ th percentile. Here is one of them.

_k_ = the _k th_ percentile. It may or may not be part of the data.

_i_ = the index (ranking or position of a data value)

_n_ = the total number of data

  * Order the data from smallest to largest.
  * Calculate  i= k 100 (n+1) i= k 100 (n+1)
  * If _i_ is an integer, then the _k th_ percentile is the data value in the _i th_ position in the ordered set of data.
  * If _i_ is not an integer, then round _i_ up and round _i_ down to the nearest integers. Average the two data values in these two positions in the ordered data set. This is easier to understand in an example.

###  Example  2.17

####  Problem

Listed are 29 ages for Academy Award winning best actors _in order from smallest to largest._   
18; 21; 22; 25; 26; 27; 29; 30; 31; 33; 36; 37; 41; 42; 47; 52; 55; 57; 58; 62; 64; 67; 69; 71; 72; 73; 74; 76; 77

  1. Find the 70th percentile.
  2. Find the 83rd percentile.

####  Solution

  1.      * _k_ = 70
     * _i_ = the index
     * _n_ = 29
_i_ =  k 100 k 100 (_n_ \+ 1) = ( 70 100 70 100 )(29 + 1) = 21. Twenty-one is an integer, and the data value in the 21st position in the ordered data set is 64. The 70th percentile is 64 years.
  2.      * _k_ = 83rd percentile
     * _i_ = the index
     * _n_ = 29
_i_ =  k 100 k 100 (_n_ \+ 1) = ( 83 100 83 100 )(29 + 1) = 24.9, which is NOT an integer. Round it down to 24 and up to 25. The age in the 24th position is 71 and the age in the 25th position is 72. Average 71 and 72. The 83rd percentile is 71.5 years.

###  Try It  2.17

Listed are 29 ages for Academy Award winning best actors _in order from smallest to largest._

18; 21; 22; 25; 26; 27; 29; 30; 31; 33; 36; 37; 41; 42; 47; 52; 55; 57; 58; 62; 64; 67; 69; 71; 72; 73; 74; 76; 77   
Calculate the 20th percentile and the 55th percentile.

###  NOTE

You can calculate percentiles using calculators and computers. There are a variety of online calculators.

### A Formula for Finding the Percentile of a Value in a Data Set

  * Order the data from smallest to largest.
  * _x_ = the number of data values counting from the bottom of the data list up to but not including the data value for which you want to find the percentile.
  * _y_ = the number of data values equal to the data value for which you want to find the percentile.
  * _n_ = the total number of data.
  * Calculate  x+0.5y n x+0.5y n(100). Then round to the nearest integer.

###  Example  2.18

####  Problem

Listed are 29 ages for Academy Award winning best actors _in order from smallest to largest._   
18; 21; 22; 25; 26; 27; 29; 30; 31; 33; 36; 37; 41; 42; 47; 52; 55; 57; 58; 62; 64; 67; 69; 71; 72; 73; 74; 76; 77

  1. Find the percentile for 58.
  2. Find the percentile for 25.

####  Solution

  1. Counting from the bottom of the list, there are 18 data values less than 58. There is one value of 58. 

_x_ = 18 and _y_ = 1. x+0.5y n x+0.5y n (100) =  18+0.5(1) 29 18+0.5(1) 29 (100) = 63.80. 58 is the 64th percentile.

  2. Counting from the bottom of the list, there are three data values less than 25. There is one value of 25. 

_x_ = 3 and _y_ = 1. x+0.5y n x+0.5y n (100) =  3+0.5(1) 29 3+0.5(1) 29 (100) = 12.07. Twenty-five is the 12th percentile.

###  Try It  2.18

Listed are 30 ages for Academy Award winning best actors _in order from smallest to largest._

18; 21; 22; 25; 26; 27; 29; 30; 31, 31; 33; 36; 37; 41; 42; 47; 52; 55; 57; 58; 62; 64; 67; 69; 71; 72; 73; 74; 76; 77   
Find the percentiles for 47 and 31.

### Interpreting Percentiles, Quartiles, and Median

A percentile indicates the relative standing of a data value when data are sorted into numerical order from smallest to largest. Percentages of data values are less than or equal to the pth percentile. For example, 15% of data values are less than or equal to the 15th percentile.

  * Low percentiles always correspond to lower data values.
  * High percentiles always correspond to higher data values.

A percentile may or may not correspond to a value judgment about whether it is "good" or "bad." The interpretation of whether a certain percentile is "good" or "bad" depends on the context of the situation to which the data applies. In some situations, a low percentile would be considered "good;" in other contexts a high percentile might be considered "good". In many situations, there is no value judgment that applies.

Understanding how to interpret percentiles properly is important not only when describing data, but also when calculating probabilities in later chapters of this text.

###  NOTE

When writing the interpretation of a percentile in the context of the given data, the sentence should contain the following information.

  * information about the context of the situation being considered
  * the data value (value of the variable) that represents the percentile
  * the percent of individuals or items with data values below the percentile
  * the percent of individuals or items with data values above the percentile.

###  Example  2.19

####  Problem

On a timed math test, the first quartile for time it took to finish the exam was 35 minutes. Interpret the first quartile in the context of this situation.

####  Solution

  * Twenty-five percent of students finished the exam in 35 minutes or less. 
  * Seventy-five percent of students finished the exam in 35 minutes or more.
  * A low percentile could be considered good, as finishing more quickly on a timed exam is desirable. (If you take too long, you might not be able to finish.)

###  Try It  2.19

For the 100-meter dash, the third quartile for times for finishing the race was 11.5 seconds. Interpret the third quartile in the context of the situation.

###  Example  2.20

####  Problem

On a 20 question math test, the 70th percentile for number of correct answers was 16. Interpret the 70th percentile in the context of this situation.

###  Try It  2.20

On a 60 point written assignment, the 80th percentile for the number of points earned was 49. Interpret the 80th percentile in the context of this situation.

###  Example  2.21

####  Problem

At a community college, it was found that the 30th percentile of credit units that students are enrolled for is seven units. Interpret the 30th percentile in the context of this situation.

###  Try It  2.21

During a season, the 40th percentile for points scored per player in a game is eight. Interpret the 40th percentile in the context of this situation.

###  Example  2.22

Sharpe Middle School is applying for a grant that will be used to add fitness equipment to the gym. The principal surveyed 15 anonymous students to determine how many minutes a day the students spend exercising. The results from the 15 anonymous students are shown.

0 minutes; 40 minutes; 60 minutes; 30 minutes; 60 minutes

10 minutes; 45 minutes; 30 minutes; 300 minutes; 90 minutes;

30 minutes; 120 minutes; 60 minutes; 0 minutes; 20 minutes

Determine the following five values.

  * Min = 0
  * _Q_ 1 = 20
  * Med = 40
  * _Q_ 3 = 60
  * Max = 300

If you were the principal, would you be justified in purchasing new fitness equipment? Since 75% of the students exercise for 60 minutes or less daily, and since the _IQR_ is 40 minutes (60 – 20 = 40), we know that half of the students surveyed exercise between 20 minutes and 60 minutes daily. This seems a reasonable amount of time spent exercising, so the principal would be justified in purchasing the new equipment.

However, the principal needs to be careful. The value 300 appears to be a potential outlier.

_Q_ 3 \+ 1.5(_IQR_) = 60 + (1.5)(40) = 120.

The value 300 is greater than 120 so it is a potential outlier. If we delete it and calculate the five values, we get the following values:

  * Min = 0
  * _Q_ 1 = 20
  * _Q_ 3 = 60
  * Max = 120

We still have 75% of the students exercising for 60 minutes or less daily and half of the students exercising between 20 and 60 minutes a day. However, 15 students is a small sample and the principal should survey more students to be sure of his survey results.

