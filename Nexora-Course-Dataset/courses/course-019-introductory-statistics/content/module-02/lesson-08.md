# 2.7 Measures of the Spread of the Data

> Source: Introductory Statistics. OpenStax / Rice University.
> Official URL: https://openstax.org/books/introductory-statistics/pages/2-7-measures-of-the-spread-of-the-data
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 2.7 Measures of the Spread of the Data

An important characteristic of any set of data is the variation in the data. In some data sets, the data values are concentrated closely near the mean; in other data sets, the data values are more widely spread out from the mean. The most common measure of variation, or spread, is the standard deviation. The standard deviation is a number that measures how far data values are from their mean.

### The standard deviation

  * provides a numerical measure of the overall amount of variation in a data set, and
  * can be used to determine whether a particular data value is close to or far from the mean.

#### The standard deviation provides a measure of the overall variation in a data set

The standard deviation is always positive or zero. The standard deviation is small when the data are all concentrated close to the mean, exhibiting little variation or spread. The standard deviation is larger when the data values are more spread out from the mean, exhibiting more variation.

Suppose that we are studying the amount of time customers wait in line at the checkout at supermarket _A_ and supermarket _B_. the average wait time at both supermarkets is five minutes. At supermarket _A_ , the standard deviation for the wait time is two minutes; at supermarket _B_ the standard deviation for the wait time is four minutes.

Because supermarket _B_ has a higher standard deviation, we know that there is more variation in the wait times at supermarket _B_. Overall, wait times at supermarket _B_ are more spread out from the average; wait times at supermarket _A_ are more concentrated near the average.

#### The standard deviation can be used to determine whether a data value is close to or far from the mean.

Suppose that Rosa and Binh both shop at supermarket _A_. Rosa waits at the checkout counter for seven minutes and Binh waits for one minute. At supermarket _A_ , the mean waiting time is five minutes and the standard deviation is two minutes. The standard deviation can be used to determine whether a data value is close to or far from the mean.

**Rosa waits for seven minutes:**

  * Seven is two minutes longer than the average of five; two minutes is equal to one standard deviation.
  * Rosa's wait time of seven minutes is **two minutes longer than the average** of five minutes.
  * Rosa's wait time of seven minutes is **one standard deviation above the average** of five minutes.

**Binh waits for one minute.**

  * One is four minutes less than the average of five; four minutes is equal to two standard deviations.
  * Binh's wait time of one minute is **four minutes less than the average** of five minutes.
  * Binh's wait time of one minute is **two standard deviations below the average** of five minutes.
  * A data value that is two standard deviations from the average is just on the borderline for what many statisticians would consider to be far from the average. Considering data to be far from the mean if it is more than two standard deviations away is more of an approximate "rule of thumb" than a rigid rule. In general, the shape of the distribution of the data affects how much of the data is further away than two standard deviations. (You will learn more about this in later chapters.)

The number line may help you understand standard deviation. If we were to put five and seven on a number line, seven is to the right of five. We say, then, that seven is **one** standard deviation to the **right** of five because 5 + (1)(2) = 7.

If one were also part of the data set, then one is **two** standard deviations to the **left** of five because 5 + (–2)(2) = 1.

![This shows a number line in intervals of 1 from 0 to 7.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a72e059b492612b9476644278af2f4d1b9eff89a) Figure  2.24

  * In general, a **value = mean + (#ofSTDEV)(standard deviation)**
  * where #ofSTDEVs = the number of standard deviations
  * #ofSTDEV does not need to be an integer
  * One is **two standard deviations less than the mean** of five because: 1 = 5 + (–2)(2).

The equation **value = mean + (#ofSTDEVs)(standard deviation)** can be expressed for a sample and for a population. 

  * **sample:** x =  x ¯ \+ (#ofSTDEV)(s) x =  x ¯ \+ (#ofSTDEV)(s)
  * **Population:** x=μ+(#ofSTDEV)(σ) x=μ+(#ofSTDEV)(σ)

The lower case letter _s_ represents the sample standard deviation and the Greek letter _σ_ (sigma, lower case) represents the population standard deviation.   
  
The symbol x¯x¯ is the sample mean and the Greek symbol μμ is the population mean.

#### Calculating the Standard Deviation

If _x_ is a number, then the difference "_x_ – mean" is called its **deviation**. In a data set, there are as many deviations as there are items in the data set. The deviations are used to calculate the standard deviation. If the numbers belong to a population, in symbols a deviation is _x_ – _μ_. For sample data, in symbols a deviation is _x_ –  x ¯ x ¯ .

The procedure to calculate the standard deviation depends on whether the numbers are the entire population or are data from a sample. The calculations are similar, but not identical. Therefore the symbol used to represent the standard deviation depends on whether it is calculated from a population or a sample. The lower case letter s represents the sample standard deviation and the Greek letter _σ_ (sigma, lower case) represents the population standard deviation. If the sample has the same characteristics as the population, then s should be a good estimate of _σ_.

To calculate the standard deviation, we need to calculate the variance first. The variance is the **average of the squares of the deviations** (the _x_ –  x ¯ x ¯ values for a sample, or the _x_ – _μ_ values for a population). The symbol _σ_ 2 represents the population variance; the population standard deviation _σ_ is the square root of the population variance. The symbol _s_ 2 represents the sample variance; the sample standard deviation _s_ is the square root of the sample variance. You can think of the standard deviation as a special average of the deviations.

If the numbers come from a census of the entire **population** and not a sample, when we calculate the average of the squared deviations to find the variance, we divide by _N_ , the number of items in the population. If the data are from a **sample** rather than a population, when we calculate the average of the squared deviations, we divide by **_n_ – 1**, one less than the number of items in the sample.

#### Formulas for the Sample Standard Deviation

  * s= Σ (x − x ¯ ) 2 n−1 s= Σ (x − x ¯ ) 2 n−1 or  s= Σf (x− x ¯ ) 2 n−1 s= Σf (x− x ¯ ) 2 n−1
  * For the sample standard deviation, the denominator is **_n_ \- 1**, that is the sample size MINUS 1.

#### Formulas for the Population Standard Deviation

  * σ = Σ (x−μ) 2 N σ = Σ (x−μ) 2 N or  σ = Σf (x–μ) 2 N σ = Σf (x–μ) 2 N
  * For the population standard deviation, the denominator is _N_ , the number of items in the population.

In these formulas, _f_ represents the frequency with which a value appears. For example, if a value appears once, _f_ is one. If a value appears three times in the data set or population, _f_ is three.

### Sampling Variability of a Statistic

The statistic of a sampling distribution was discussed in [Descriptive Statistics: Measuring the Center of the Data](<2-5-measures-of-the-center-of-the-data>). How much the statistic varies from one sample to another is known as the sampling variability of a statistic. You typically measure the sampling variability of a statistic by its standard error. The **standard error of the mean** is an example of a standard error. It is a special standard deviation and is known as the standard deviation of the sampling distribution of the mean. You will cover the standard error of the mean in the chapter [The Central Limit Theorem](<7-introduction>) (not now). The notation for the standard error of the mean is  σ n σ n where _σ_ is the standard deviation of the population and n is the size of the sample.

###  NOTE

**In practice, USE A CALCULATOR OR COMPUTER SOFTWARE TO CALCULATE THE STANDARD DEVIATION. If you are using a TI-83, 83+, 84+ calculator, you need to select the appropriate standard deviation _σ x_ or _s x_ from the summary statistics.** We will concentrate on using and interpreting the information that the standard deviation gives us. However you should study the following step-by-step example to help you understand how the standard deviation measures variation from the mean. (The calculator instructions appear at the end of this example.)

###  Example  2.32

In a fifth grade class, the teacher was interested in the average age and the sample standard deviation of the ages of her students. The following data are the ages for a SAMPLE of _n_ = 20 fifth grade students. The ages are rounded to the nearest half year: 

9; 9.5; 9.5; 10; 10; 10; 10; 10.5; 10.5; 10.5; 10.5; 11; 11; 11; 11; 11; 11; 11.5; 11.5; 11.5;

x ¯ = 9 + 9.5(2) + 10(4) + 10.5(4) + 11(6) + 11.5(3) 20 =10.525 x ¯ = 9 + 9.5(2) + 10(4) + 10.5(4) + 11(6) + 11.5(3) 20 =10.525

The average age is 10.53 years, rounded to two places.

The variance may be calculated by using a table. Then the standard deviation is calculated by taking the square root of the variance. We will explain the parts of the table after calculating _s_.

Data | Freq. | Deviations | _Deviations_ 2 | (Freq.)(_Deviations_ 2)  
---|---|---|---|---  
_x_ | _f_ | (_x_ –  x ¯ x ¯ ) | (_x_ –  x ¯ x ¯ )2 | (_f_)(_x_ –  x ¯ x ¯ )2  
9 | 1 | 9 – 10.525 = –1.525 | (–1.525)2 = 2.325625 | 1 × 2.325625 = 2.325625  
9.5 | 2 | 9.5 – 10.525 = –1.025 | (–1.025)2 = 1.050625 | 2 × 1.050625 = 2.101250  
10 | 4 | 10 – 10.525 = –0.525 | (–0.525)2 = 0.275625 | 4 × 0.275625 = 1.1025  
10.5 | 4 | 10.5 – 10.525 = –0.025 | (–0.025)2 = 0.000625 | 4 × 0.000625 = 0.0025  
11 | 6 | 11 – 10.525 = 0.475 | (0.475)2 = 0.225625 | 6 × 0.225625 = 1.35375  
11.5 | 3 | 11.5 – 10.525 = 0.975 | (0.975)2 = 0.950625 | 3 × 0.950625 = 2.851875  
|  |  |  | The total is 9.7375  
  
Table  2.29

The sample variance, _s_ 2, is equal to the sum of the last column (9.7375) divided by the total number of data values minus one (20 – 1):

s 2 = 9.7375 20−1 =0.5125 s 2 = 9.7375 20−1 =0.5125

The **sample standard deviation** _s_ is equal to the square root of the sample variance:

s= 0.5125 =0.715891, s= 0.5125 =0.715891, which is rounded to two decimal places, _s_ = 0.72.

**Typically, you do the calculation for the standard deviation on your calculator or computer**. The intermediate results are not rounded. This is done for accuracy.

####  Problem

  * For the following problems, recall that **value = mean + (#ofSTDEVs)(standard deviation)**. Verify the mean and standard deviation or a calculator or computer.
  * For a sample: _x_ =  x ¯ x ¯ \+ (#ofSTDEVs)(_s_)
  * For a population: _x_ = _μ_ \+ (#ofSTDEVs)(_σ_)
  * For this example, use _x_ =  x ¯ x ¯ \+ (#ofSTDEVs)(_s_) because the data is from a sample

  1. Verify the mean and standard deviation on your calculator or computer.
  2. Find the value that is one standard deviation above the mean. Find ( x ¯ x ¯ \+ 1s).
  3. Find the value that is two standard deviations below the mean. Find ( x ¯ x ¯ – 2s).
  4. Find the values that are 1.5 standard deviations **from** (below and above) the mean.

####  Solution

  1. ###  Using the TI-83, 83+, 84, 84+ Calculator

     * Clear lists L1 and L2. Press STAT 4:ClrList. Enter 2nd 1 for L1, the comma (,), and 2nd 2 for L2.
     * Enter data into the list editor. Press STAT 1:EDIT. If necessary, clear the lists by arrowing up into the name. Press CLEAR and arrow down.
     * Put the data values (9, 9.5, 10, 10.5, 11, 11.5) into list L1 and the frequencies (1, 2, 4, 4, 6, 3) into list L2. Use the arrow keys to move around.
     * Press STAT and arrow to CALC. Press 1:1-VarStats and enter L1 (2nd 1), L2 (2nd 2). Do not forget the comma. Press ENTER.
     * x ¯ x ¯ = 10.525
     * Use Sx because this is sample data (not a population): Sx=0.715891

  2. ( x ¯ x ¯ \+ 1s) = 10.53 + (1)(0.72) = 11.25
  3. ( x ¯ x ¯ – 2 _s_) = 10.53 – (2)(0.72) = 9.09
  4.      * ( x ¯ x ¯ – 1.5 _s_) = 10.53 – (1.5)(0.72) = 9.45
     * ( x ¯ x ¯ \+ 1.5 _s_) = 10.53 + (1.5)(0.72) = 11.61

###  Try It  2.32

On a baseball team, the ages of each of the players are as follows:

21; 21; 22; 23; 24; 24; 25; 25; 28; 29; 29; 31; 32; 33; 33; 34; 35; 36; 36; 36; 36; 38; 38; 38; 40 

  
Use your calculator or computer to find the mean and standard deviation. Then find the value that is two standard deviations above the mean.

#### Explanation of the standard deviation calculation shown in the table

The deviations show how spread out the data are about the mean. The data value 11.5 is farther from the mean than is the data value 11 which is indicated by the deviations 0.97 and 0.47. A positive deviation occurs when the data value is greater than the mean, whereas a negative deviation occurs when the data value is less than the mean. The deviation is –1.525 for the data value nine. **If you add the deviations, the sum is always zero**. (For [Example 2.32](<2-7-measures-of-the-spread-of-the-data#element-655>), there are _n_ = 20 deviations.) So you cannot simply add the deviations to get the spread of the data. By squaring the deviations, you make them positive numbers, and the sum will also be positive. The variance, then, is the average squared deviation.

The variance is a squared measure and does not have the same units as the data. Taking the square root solves the problem. The standard deviation measures the spread in the same units as the data.

Notice that instead of dividing by _n_ = 20, the calculation divided by _n_ – 1 = 20 – 1 = 19 because the data is a sample. For the **sample** variance, we divide by the sample size minus one (_n_ – 1). Why not divide by _n_? The answer has to do with the population variance. **The sample variance is an estimate of the population variance.** Based on the theoretical mathematics that lies behind these calculations, dividing by (_n_ – 1) gives a better estimate of the population variance.

###  NOTE

Your concentration should be on what the standard deviation tells us about the data. The standard deviation is a number which measures how far the data are spread from the mean. Let a calculator or computer do the arithmetic.

The standard deviation, _s_ or _σ_ , is either zero or larger than zero. Describing the data with reference to the spread is called "variability". The variability in data depends upon the method by which the outcomes are obtained; for example, by measuring or by random sampling. When the standard deviation is zero, there is no spread; that is, the all the data values are equal to each other. The standard deviation is small when the data are all concentrated close to the mean, and is larger when the data values show more variation from the mean. When the standard deviation is a lot larger than zero, the data values are very spread out about the mean; outliers can make _s_ or _σ_ very large.

The standard deviation, when first presented, can seem unclear. By graphing your data, you can get a better "feel" for the deviations and the standard deviation. You will find that in symmetrical distributions, the standard deviation can be very helpful but in skewed distributions, the standard deviation may not be much help. The reason is that the two sides of a skewed distribution have different spreads. In a skewed distribution, it is better to look at the first quartile, the median, the third quartile, the smallest value, and the largest value. Because numbers can be confusing, **always graph your data**. Display your data in a histogram or a box plot.

###  Example  2.33

####  Problem

Use the following data (first exam scores) from Susan Dean's spring pre-calculus class:

33; 42; 49; 49; 53; 55; 55; 61; 63; 67; 68; 68; 69; 69; 72; 73; 74; 78; 80; 83; 88; 88; 88; 90; 92; 94; 94; 94; 94; 96; 100

  1. Create a chart containing the data, frequencies, relative frequencies, and cumulative relative frequencies to three decimal places.
  2. Calculate the following to one decimal place using a TI-83+ or TI-84 calculator: 
     1. The sample mean
     2. The sample standard deviation
     3. The median
     4. The first quartile
     5. The third quartile
     6. _IQR_
  3. Construct a box plot and a histogram on the same set of axes. Make comments about the box plot, the histogram, and the chart.

####  Solution

  1. See [Table 2.30](<2-7-measures-of-the-spread-of-the-data#id6947804>)
  2.      1. The sample mean = 73.5
     2. The sample standard deviation = 17.9
     3. The median = 73
     4. The first quartile = 61
     5. The third quartile = 90
     6. _IQR_ = 90 – 61 = 29
  3. The _x_ -axis goes from 32.5 to 100.5; _y_ -axis goes from –2.4 to 15 for the histogram. The number of intervals is five, so the width of an interval is (100.5 – 32.5) divided by five, is equal to 13.6. Endpoints of the intervals are as follows: the starting point is 32.5, 32.5 + 13.6 = 46.1, 46.1 + 13.6 = 59.7, 59.7 + 13.6 = 73.3, 73.3 + 13.6 = 86.9, 86.9 + 13.6 = 100.5 = the ending value; No data values fall on an interval boundary.

![A hybrid image displaying both a histogram and box plot described in detail in the answer solution above.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f52363d0d4686738d58f1174609c14cf3971f2a3) Figure  2.25

Data | Frequency | Relative Frequency | Cumulative Relative Frequency  
---|---|---|---  
33 | 1 | 0.032 | 0.032  
42 | 1 | 0.032 | 0.064  
49 | 2 | 0.065 | 0.129  
53 | 1 | 0.032 | 0.161  
55 | 2 | 0.065 | 0.226  
61 | 1 | 0.032 | 0.258  
63 | 1 | 0.032 | 0.29  
67 | 1 | 0.032 | 0.322  
68 | 2 | 0.065 | 0.387  
69 | 2 | 0.065 | 0.452  
72 | 1 | 0.032 | 0.484  
73 | 1 | 0.032 | 0.516  
74 | 1 | 0.032 | 0.548  
78 | 1 | 0.032 | 0.580  
80 | 1 | 0.032 | 0.612  
83 | 1 | 0.032 | 0.644  
88 | 3 | 0.097 | 0.741  
90 | 1 | 0.032 | 0.773  
92 | 1 | 0.032 | 0.805  
94 | 4 | 0.129 | 0.934  
96 | 1 | 0.032 | 0.966  
100 | 1 | 0.032 | 0.998 (Why isn't this value 1?)  
  
Table  2.30

The long left whisker in the box plot is reflected in the left side of the histogram. The spread of the exam scores in the lower 50% is greater (73 – 33 = 40) than the spread in the upper 50% (100 – 73 = 27). The histogram, box plot, and chart all reflect this. There are a substantial number of A and B grades (80s, 90s, and 100). The histogram clearly shows this. The box plot shows us that the middle 50% of the exam scores (_IQR_ = 29) are Ds, Cs, and Bs. The box plot also shows us that the lower 25% of the exam scores are Ds and Fs.

###  Try It  2.33

The following data show the different types of pet food stores in the area carry.   
6; 6; 6; 6; 7; 7; 7; 7; 7; 8; 9; 9; 9; 9; 10; 10; 10; 10; 10; 11; 11; 11; 11; 12; 12; 12; 12; 12; 12;   
Calculate the sample mean and the sample standard deviation to one decimal place using a TI-83+ or TI-84 calculator.

### Standard deviation of Grouped Frequency Tables

Recall that for grouped data we do not know individual data values, so we cannot describe the typical value of the data with precision. In other words, we cannot find the exact mean, median, or mode. We can, however, determine the best estimate of the measures of center by finding the mean of the grouped data with the formula: Mean of Frequency Table= ∑ fm ∑ f Mean of Frequency Table= ∑ fm ∑ f   
where  f=f= interval frequencies and _m_ = interval midpoints.

Just as we could not find the exact mean, neither can we find the exact standard deviation. Remember that standard deviation describes numerically the expected deviation a data value has from the mean. In simple English, the standard deviation allows us to compare how “unusual” individual data is compared to the mean.

###  Example  2.34

Find the standard deviation for the data in [Table 2.31](<2-7-measures-of-the-spread-of-the-data#fs-idm67330768>).

Class | Frequency, ff | Midpoint, mm | f⋅mf⋅m | x¯x¯ | m-x¯m-x¯ | (m-x¯)2(m-x¯)2 | f(m-x¯)2f(m-x¯)2  
---|---|---|---|---|---|---|---  
0–2 | 1 | 1 | 1 | 7.58 | -6.58 | 43.2964 | 43.2964  
3–5 | 6 | 4 | 24 | 7.58 | -3.58 | 12.8164 | 76.8984  
6–8 | 10 | 7 | 70 | 7.58 | -0.58 | 0.3364 | 3.364  
9–11 | 7 | 10 | 70 | 7.58 | 2.42 | 5.8564 | 40.9948  
12–14 | 0 | 13 | 0 | 7.58 | 5.42 | 29.3764 | 0  
15–17 | 2 | 16 | 32 | 7.58 | 8.42 | 70.8964 | 141.7928  
**SUM** (ΣΣ) | 26 |  | 197 |  |  |  | 43.2964  
  
Table  2.31

The values in the second, third, and fourth columns of [Table 2.31](<2-7-measures-of-the-spread-of-the-data#fs-idm67330768>) are used to calculate the mean of the grouped frequency table, the value in the fifth column.

x¯=ΣfmΣf=19726≈7.58.x¯=ΣfmΣf=19726≈7.58.

2.1

After calculating x¯x¯, find the difference, m-x¯m-x¯, for each midpoint, mm. Next, square each difference. In the final column, calculate the product of the frequency and the squared difference for each class.

The table makes it easy to use the formula for calculating the standard deviation of a grouped frequency table:

sx=Σf(m-x¯)2n-1=43.296426-1≈3.50.sx=Σf(m-x¯)2n-1=43.296426-1≈3.50.

2.2

Although the formula is not complicated, these calculations are typically performed using technology.

###  Try It  2.34

Find the standard deviation for the data from the previous example

Class| Frequency, _f_  
---|---  
0–2| 1  
3–5| 6  
6–8| 10  
9–11| 7  
12–14| 0  
15–17| 2  
  
Table  2.32

First, press the **STAT** key and select **1:Edit**

![Image of a TI calculator screen. After pressing the STAT key, screen displays top menu choices EDIT, CALC, TESTS. EDIT is selected. Below the top menu, option 1: Edit… is selected.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/07f4c94ddc1680bc168683d7fdcc366cd1e02ee8) Figure  2.26

Input the midpoint values into **L1** and the frequencies into **L2**

![Image of a TI calculator screen. L1 list shows entries 1, 4, 7, 10, 13, 16. L2 list shows 1, 6, 10, 7, 0, 2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a9a1efb9883aeba515fead380ce9ed970a54c1eb) Figure  2.27

Select **STAT** , **CALC** , and **1: 1-Var Stats**

![Image of a TI calculator screen. After pressing the STAT key, screen displays top menu choices EDIT, CALC, TESTS. CALC is selected. Below the top menu, option 1: 1–Var Stats is selected.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/53061e94d7fc16a08675d2a2ca763f6345a632d7) Figure  2.28

Select **2 nd** then **1** then , **2 nd** then **2 Enter**

![Image of a TI calculator screen. At the top of the screen, the label shows 1–Var Stats. Below this label, the screen displays x-bar = 7.576923077, upper-case sigma x = 197, upper-case sigma x-squared = 1799, Sx = 3.500549407, and lower-case sigma = 3.432571103, n = 26.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/825cd4eb6dbfb02426f2f47e6908f5a4f8b7dde5) Figure  2.29

You will see displayed both a population standard deviation, _σ x_, and the sample standard deviation, _s x_.

### Comparing Values from Different Data Sets

The standard deviation is useful when comparing data values that come from different data sets. If the data sets have different means and standard deviations, then comparing the data values directly can be misleading.

  * For each data value, calculate how many standard deviations away from its mean the value is.
  * Use the formula: value = mean + (#ofSTDEVs)(standard deviation); solve for #ofSTDEVs.
  * #ofSTDEVs= value – mean standard deviation #ofSTDEVs= value – mean standard deviation
  * Compare the results of this calculation.

#ofSTDEVs is often called a "_z_ -score"; we can use the symbol _z_. In symbols, the formulas become:

Sample | xx = x¯x¯ \+ _zs_ |  z= x − x ¯ s z= x − x ¯ s  
---|---|---  
Population | xx =  μ μ \+ _zσ_ |  z= x − μ σ z= x − μ σ  
  
Table  2.33

###  Example  2.35

####  Problem

Two students, John and Ali, from different high schools, wanted to find out who had the highest GPA when compared to his school. Which student had the highest GPA when compared to his school? 

Student | GPA | School Mean GPA | School Standard Deviation  
---|---|---|---  
John | 2.85 | 3.0 | 0.7  
Ali | 77 | 80 | 10  
  
Table  2.34

####  Solution

For each student, determine how many standard deviations (#ofSTDEVs) his GPA is away from the average, for his school. Pay careful attention to signs when comparing and interpreting the answer.

z= # of STDEVs= value –mean standard deviation = x–μ σ z= # of STDEVs= value –mean standard deviation = x–μ σ

For John,  z=#ofSTDEVs= 2.85–3.0 0.7 =–0.21 z=#ofSTDEVs= 2.85–3.0 0.7 =–0.21

For Ali,  z=#ofSTDEVs= 77−80 10 =−0.3 z=#ofSTDEVs= 77−80 10 =−0.3

John has the better GPA when compared to his school because his GPA is 0.21 standard deviations **below** his school's mean while Ali's GPA is 0.3 standard deviations **below** his school's mean.

John's _z_ -score of –0.21 is higher than Ali's _z_ -score of –0.3. For GPA, higher values are better, so we conclude that John has the better GPA when compared to his school.

###  Try It  2.35

Two swimmers, Angie and Beth, from different teams, wanted to find out who had the fastest time for the 50 meter freestyle when compared to her team. Which swimmer had the fastest time when compared to her team?

Swimmer| Time (seconds)| Team Mean Time | Team Standard Deviation  
---|---|---|---  
Angie| 26.2| 27.2| 0.8  
Beth| 27.3| 30.1| 1.4  
  
Table  2.35

The following lists give a few facts that provide a little more insight into what the standard deviation tells us about the distribution of the data.

For ANY data set, no matter what the distribution of the data is:

  * At least 75% of the data is within two standard deviations of the mean.
  * At least 89% of the data is within three standard deviations of the mean.
  * At least 95% of the data is within 4.5 standard deviations of the mean.
  * This is known as Chebyshev's Rule.

For data having a distribution that is BELL-SHAPED and SYMMETRIC:

  * Approximately 68% of the data is within one standard deviation of the mean.
  * Approximately 95% of the data is within two standard deviations of the mean.
  * More than 99% of the data is within three standard deviations of the mean.
  * This is known as the Empirical Rule.
  * It is important to note that this rule only applies when the shape of the distribution of the data is bell-shaped and symmetric. We will learn more about this when studying the "Normal" or "Gaussian" probability distribution in later chapters.

