# 2.5 Measures of the Center of the Data

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/2-5-measures-of-the-center-of-the-data
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 2.5 Measures of the Center of the Data

The "center" of a data set is also a way of describing location. The two most widely used measures of the "center" of the data are the mean (average) and the median. To calculate the **mean weight** of 50 people, add the 50 weights together and divide by 50. To find the **median weight** of the 50 people, order the data and find the number that splits the data into two equal parts. The median is generally a better measure of the center when there are extreme values or outliers because it is not affected by the precise numerical values of the outliers. The mean is the most common measure of the center.

###  NOTE

The words “mean” and “average” are often used interchangeably. The substitution of one word for the other is common practice. The technical term is “arithmetic mean” and “average” is technically a center location. However, in practice among non-statisticians, “average" is commonly accepted for “arithmetic mean.”

When each value in the data set is not unique, the mean can be calculated by multiplying each distinct value by its frequency and then dividing the sum by the total number of data values. The letter used to represent the **sample mean** is an _x_ with a bar over it (pronounced “ _x_ bar”):  x – x – .

The Greek letter _μ_ (pronounced "mew") represents the **population mean**. One of the requirements for the **sample mean** to be a good estimate of the **population mean** is for the sample taken to be truly random.

To see that both ways of calculating the mean are the same, consider the sample:   
1; 1; 1; 2; 2; 3; 4; 4; 4; 4; 4

x ¯ = 1 + 1 + 1 + 2 + 2 + 3 + 4 + 4 + 4 + 4 + 4 11 = 2.7 x ¯ = 1 + 1 + 1 + 2 + 2 + 3 + 4 + 4 + 4 + 4 + 4 11 =2.7

x ¯ = 3(1)+2(2)+1(3)+5(4) 11 =2.7 x ¯ = 3(1)+2(2)+1(3)+5(4) 11 =2.7

In the second calculation, the frequencies are 3, 2, 1, and 5.

You can quickly find the location of the median by using the expression  n + 1 2 n + 1 2 .

The letter _n_ is the total number of data values in the sample. If _n_ is an odd number, the median is the middle value of the ordered data (ordered smallest to largest). If _n_ is an even number, the median is equal to the two middle values added together and divided by two after the data has been ordered. For example, if the total number of data values is 97, then  n + 1 2 n + 1 2 =  97 + 1 2 97 + 1 2 = 49. The median is the 49th value in the ordered data. If the total number of data values is 100, then  n + 1 2 n + 1 2 =  100 + 1 2 100 + 1 2 = 50.5. The median occurs midway between the 50th and 51st values. The location of the median and the value of the median are **not** the same. The upper case letter _M_ is often used to represent the median. The next example illustrates the location of the median and the value of the median.

###  Example  2.26

####  Problem

AIDS data indicating the number of months a patient with AIDS lives after taking a new antibody drug are as follows (smallest to largest):   
3; 4; 8; 8; 10; 11; 12; 13; 14; 15; 15; 16; 16; 17; 17; 18; 21; 22; 22; 24; 24; 25; 26; 26; 27; 27; 29; 29; 31; 32; 33; 33; 34; 34; 35; 37; 40; 44; 44; 47;   
Calculate the mean and the median.

####  Solution

The calculation for the mean is:

x ¯ = [ 3 + 4 + ( 8 ) ( 2 ) + 10 + 11 + 12 + 13 + 14 + ( 15 ) ( 2 ) + ( 16 ) ( 2 ) + ... + 35 + 37 + 40 + ( 44 ) ( 2 ) + 47 ] 40 = 23.6 x ¯ = [ 3 + 4 + ( 8 ) ( 2 ) + 10 + 11 + 12 + 13 + 14 + ( 15 ) ( 2 ) + ( 16 ) ( 2 ) + ... + 35 + 37 + 40 + ( 44 ) ( 2 ) + 47 ] 40 =23.6   
To find the median, _M_ , first use the formula for the location. The location is:   
n + 1 2 = 40 + 1 2 = 20.5 n + 1 2 = 40 + 1 2 =20.5   
Starting at the smallest value, the median is located between the 20th and 21st values (the two 24s):   
3; 4; 8; 8; 10; 11; 12; 13; 14; 15; 15; 16; 16; 17; 17; 18; 21; 22; 22; 24; 24; 25; 26; 26; 27; 27; 29; 29; 31; 32; 33; 33; 34; 34; 35; 37; 40; 44; 44; 47;

M = 24 + 24 2 = 24 M= 24 + 24 2 =24

###  Using the TI-83, 83+, 84, 84+ Calculator

To find the mean and the median:

Clear list L1. Pres STAT 4:ClrList. Enter 2nd 1 for list L1. Press ENTER.

Enter data into the list editor. Press STAT 1:EDIT.

Put the data values into list L1.

Press STAT and arrow to CALC. Press 1:1-VarStats. Press 2nd 1 for L1 and then ENTER.

Press the down and up arrow keys to scroll.

x ¯ x ¯ = 23.6, _M_ = 24

###  Try It  2.26

The following data show the number of months patients typically wait on a transplant list before getting surgery. The data are ordered from smallest to largest. Calculate the mean and median.

3;  4;  5;  7;  7;  7;  7;  8;  8;  9;  9;  10;  10;  10;  10;  10;  11;  12;  12;  13;  14;  14;  15;  15;  17;  17;  18;  19;  19;  19;  21;  21;  22;  22;  23;  24;  24;  24;  24

###  Example  2.27

####  Problem

Suppose that in a small town of 50 people, one person earns $5,000,000 per year and the other 49 each earn $30,000. Which is the better measure of the "center": the mean or the median?

####  Solution

x ¯ = 5,000,000+49(30,000) 50 =129,400 x ¯ = 5,000,000+49(30,000) 50 =129,400

_M_ = 30,000 

(There are 49 people who earn $30,000 and one person who earns $5,000,000.)

The median is a better measure of the "center" than the mean because 49 of the values are 30,000 and one is 5,000,000. The 5,000,000 is an outlier. The 30,000 gives us a better sense of the middle of the data.

###  Try It  2.27

In a sample of 60 households, one house is worth $2,500,000. Twenty-nine houses are worth $280,000, and all the others are worth $315,000. Which is the better measure of the “center”: the mean or the median?

Another measure of the center is the mode. The mode is the most frequent value. There can be more than one mode in a data set as long as those values have the same frequency and that frequency is the highest. A data set with two modes is called bimodal.

###  Example  2.28

Statistics exam scores for 20 students are as follows:

50; 53; 59; 59; 63; 63; 72; 72; 72; 72; 72; 76; 78; 81; 83; 84; 84; 84; 90; 93

####  Problem

Find the mode.

####  Solution

The most frequent score is 72, which occurs five times. Mode = 72.

###  Try It  2.28

The number of books checked out from the library from 25 students are as follows:

0; 0; 0; 1; 2; 3; 3; 4; 4; 5; 5; 7; 7; 7; 7; 8; 8; 8; 9; 10; 10; 11; 11; 12; 12   
Find the mode. 

###  Example  2.29

Five real estate exam scores are 430, 430, 480, 480, 495. The data set is bimodal because the scores 430 and 480 each occur twice.

When is the mode the best measure of the "center"? Consider a weight loss program that advertises a mean weight loss of six pounds the first week of the program. The mode might indicate that most people lose two pounds the first week, making the program less appealing.

###  NOTE

The mode can be calculated for qualitative data as well as for quantitative data. For example, if the data set is: red, red, red, green, green, yellow, purple, black, blue, the mode is red.

Statistical software will easily calculate the mean, the median, and the mode. Some graphing calculators can also make these calculations. In the real world, people make these calculations using software.

###  Try It  2.29

Five credit scores are 680, 680, 700, 720, 720. The data set is bimodal because the scores 680 and 720 each occur twice. Consider the annual earnings of workers at a factory. The mode is $25,000 and occurs 150 times out of 301. The median is $50,000 and the mean is $47,500. What would be the best measure of the “center”?

### The Law of Large Numbers and the Mean

The Law of Large Numbers says that if you take samples of larger and larger size from any population, then the mean x¯x¯ of the sample is very likely to get closer and closer to _µ_. This is discussed in more detail later in the text.

### Sampling Distributions and Statistic of a Sampling Distribution

You can think of a sampling distribution as a **relative frequency distribution** with a great many samples. (See **Sampling and Data** for a review of relative frequency). Suppose thirty randomly selected students were asked the number of movies they watched the previous week. The results are in the **relative frequency table** shown below.

# of movies | Relative Frequency  
---|---  
0 |  5 30 5 30  
1 |  15 30 15 30  
2 |  6 30 6 30  
3 |  3 30 3 30  
4 |  1 30 1 30  
  
Table  2.24

**If you let the number of samples get very large (say, 300 million or more), the relative frequency table becomes a relative frequency distribution**.

A **statistic** is a number calculated from a sample. Statistic examples include the mean, the median and the mode as well as others. The sample mean x¯x¯ is an example of a statistic which estimates the population mean _μ_.

### Calculating the Mean of Grouped Frequency Tables

When only grouped data is available, you do not know the individual data values (we only know intervals and interval frequencies); therefore, you cannot compute an exact mean for the data set. What we must do is estimate the actual mean by calculating the mean of a frequency table. A frequency table is a data representation in which grouped data is displayed along with the corresponding frequencies. To calculate the mean from a grouped frequency table we can apply the basic definition of mean: _mean_ =  data sum number of data values data sum number of data values We simply need to modify the definition to fit within the restrictions of a frequency table.

Since we do not know the individual data values we can instead find the midpoint of each interval. The midpoint is  lower boundary+upper boundary 2 lower boundary+upper boundary 2 . We can now modify the mean definition to be  Mean of Frequency Table= ∑ fm ∑ f Mean of Frequency Table= ∑ fm ∑ f where _f_ = the frequency of the interval and _m_ = the midpoint of the interval.

###  Example  2.30

####  Problem

A frequency table displaying professor Blount’s last statistic test is shown. Find the best estimate of the class mean.

Grade Interval | Number of Students  
---|---  
50–56.5 | 1  
56.5–62.5 | 0  
62.5–68.5 | 4  
68.5–74.5 | 4  
74.5–80.5 | 2  
80.5–86.5 | 3  
86.5–92.5 | 4  
92.5–98.5 | 1  
  
Table  2.25

####  Solution

  * Find the midpoints for all intervals

Grade Interval | Midpoint  
---|---  
50–56.5 | 53.25  
56.5–62.5 | 59.5  
62.5–68.5 | 65.5  
68.5–74.5 | 71.5  
74.5–80.5 | 77.5  
80.5–86.5 | 83.5  
86.5–92.5 | 89.5  
92.5–98.5 | 95.5  
  
Table  2.26

  * Calculate the sum of the product of each interval frequency and midpoint. ∑ ​ fm ∑ ​ fm   
  
53.25(1)+59.5(0)+65.5(4)+71.5(4)+77.5(2)+83.5(3)+89.5(4)+95.5(1)=1460.25 53.25(1)+59.5(0)+65.5(4)+71.5(4)+77.5(2)+83.5(3)+89.5(4)+95.5(1)=1460.25
  * μ= ∑ fm ∑ f = 1460.25 19 =76.86 μ= ∑ fm ∑ f = 1460.25 19 =76.86

###  Try It  2.30

Maris conducted a study on the effect that playing video games has on memory recall. As part of her study, she compiled the following data:

Hours Teenagers Spend on Video Games | Number of Teenagers  
---|---  
0–3.5| 3  
3.5–7.5| 7  
7.5–11.5| 12  
11.5–15.5| 7  
15.5–19.5| 9  
  
Table  2.27

What is the best estimate for the mean number of hours spent playing video games?

