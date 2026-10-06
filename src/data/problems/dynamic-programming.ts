import { example, para, rich, type ProblemSeed } from "./types";

/**
 * Dynamic programming: name the subproblem, write the recurrence, fill a table
 * in dependency order, then shrink the table to the values still in use.
 */
export const DYNAMIC_PROGRAMMING_PROBLEMS: ProblemSeed[] = [
  {
    slug: "sponsor-slot-revenue",
    title: "Sponsor Slot Revenue",
    difficulty: "EASY",
    learningObjective:
      "Turn a take-or-skip choice with a no-neighbours rule into a two-value rolling recurrence.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A community radio station sells its evening hours to local sponsors. Each hour has a bid attached, but listeners complained about back-to-back adverts, so the station now has a rule: two neighbouring hours can never both be sponsored."
      ),
      rich(
        "Given the bids in hour order, return the largest total the station can collect while respecting the rule. Leaving every hour unsponsored is allowed, so the answer is never below ",
        { code: "0" },
        "."
      ),
      example(
        "bids = [3, 8, 4, 2, 9]",
        "17",
        [
          { state: "hour 0 (3): best = 3", note: "take it; nothing came before" },
          {
            state: "hour 1 (8): best = max(3, 0 + 8) = 8",
            note: "dropping hour 0 for hour 1 pays more",
          },
          {
            state: "hour 2 (4): best = max(8, 3 + 4) = 8",
            note: "skipping hour 2 keeps 8",
          },
          {
            state: "hour 3 (2): best = max(8, 8 + 2) = 10",
            note: "hours 1 and 3 are not neighbours",
          },
          {
            state: "hour 4 (9): best = max(10, 8 + 9) = 17",
            note: "hours 1 and 4: 8 + 9",
          },
        ],
        "Best total after each hour"
      ),
    ],
    constraints: ["0 ≤ bids.length ≤ 100000", "0 ≤ bids[i] ≤ 10000"],
    signature: {
      params: ["int[]"],
      paramNames: ["bids"],
      returns: "int",
      functionName: "maxSponsorRevenue",
    },
    tests: [
      {
        input: "3 8 4 2 9",
        expected: "17",
        isSample: true,
        explanation:
          "Sponsor hours 1 and 4 for 8 + 9. No other non-neighbouring choice earns more.",
      },
      {
        input: "5 1 1 5",
        expected: "10",
        isSample: true,
        explanation:
          "The two outer hours are not neighbours, so both can be sold: 5 + 5.",
      },
      { input: "", expected: "0" },
      { input: "7", expected: "7" },
      { input: "2 2 2 2 2", expected: "6" },
      { input: "1 20 1 1 20 1", expected: "40" },
      { input: "0 0 0", expected: "0" },
      { input: "4 1 2 7 5 3 1", expected: "14" },
      {
        input:
          "506 83 690 293 939 295 522 201 801 572 238 536 640 537 725 557 880 773 777 32 110 11 240 119 82 758 263 472 589 437 377 896 222 5 87 167 510 137 217 131 170 968 748 663 468 61 29 682 99 728 446 64 187 974 279 126 396 496 233 162 943 365 232 39 522 904 507 0 645 703 250 670 214 871 100 126 959 41 960 420 508 839 798 931 957 173 41 437 730 809 620 805 359 694 119 543 715 832 338 593 38 315 300 494 189 580 509 157 566 915 46 132 995 114 474 34 540 108 505 659 234 494 308 144 873 552 912 72 74 928 67 766 455 897 601 607 817 940 116 477 181 830 865 967 222 624 260 107 636 913 521 595 947 76 424 727 186 23 806 412 8 469 110 380 117 483 634 66 957 706 442 173 331 846 503 233 562 803 76 423 498 606 514 550 465 645 658 367 55 923 789 297 779 425 65 215 455 91 601 565 519 836 638 85 920 677 414 805 925 291 616 884 487 442 116 453 138 494 14 931 506 6 466 157 574 449 437 364 733 643 100 711 747 161 315 12 426 927 39 566 441 31 273 288 548 758 573 469 517 538 248 649 717 857 576 114 543 930 145 409 864 703 760 69 872 937 183 740 997 929 441 374 25 618 276 496 217 420 989 880 806 664 646 666 934 896 837 65 571 997 998 352 166 435 930 220 641 545 437 587 752 483 990 136 233 288 499 98 266 717 549 943 912 432 318 884 78 427 268 400 31 529 712 975 165 276 916 512 148 517 920 145 237 985 590 865 172 478 270 969 244 483 970 928 251 593 228 438 388 125 1 474 113 665 461 877 157 726 785 85 322 740 947 923 406 544 0 44 211 705 239 594 77 203 540 153 684 373 448 754 872 141 185 408 0 8 588 207 248 917 37 118 385 60 625 432 252 228 541 113 801 450 133 299 520 669 562 950 411 374 643 983 383 196 756 892 444 983 150 542 756 818 254 819 753 738 349 440 239 807 220 28 552 312 26 213 620 797 918 600 8 920 735 234 208 685 423 753 227 299 234 712 718 68 124 933 137 857 31 340 540 109 673 483 642 395 814 478 66 856 878 510 727 938 925 846 694 92 853 506 772 290 692 180 520 278 117 789 369 586 70 130 2 459 894 6 805 100 950 400 787 631 900 111 314 624 156 519 78 504 705 889 596 985 81 958 886 266 700 907 252 395 730 728 77 352 797 560 643 25 160 543 407 460 688 707 300 349 798 299 139 67 291 750 705 553 623 124 839 744 625 947 915 330 980 13 192 98 538 237 82 682 129 454 33 330 329 993 955 78 250 437 342 364 999 949 687 224 351 681 408 845 622 891 884 734 304 156 700 813 888 806 556 968 663 13 557 358 586 555 699 394 191 630 982 125 23 983 797 469 431 462 171 643 825 855 603 483 586 149 124 318 466 280 867 141 466 513 743 326 697 744 87 867 77 129 530 981 204 275 674 796 529 48 343 33 302 392 30 330 142 33 853 630 12 951 866 531 7 642 853 223 7 200 586 554 210 258 127 74 979 60 603 147 389 133 169 120 868 260 165 119 343 221 689 121 394 732 483 948 826 203 626 241 871 610 198 50 780 394 1 670 104 988 611 644 986 632 522 70 123 269 360 347 863 374 312 839 956 823 969 676 695 980 399 450 10 234 158 511 668 160 257 278 980 224 100 65 288 409 839 496 527 605 262 563 388 913 15 356 671 957 161 834 769 449 113 755 258 72 340 8 961 506 517 17 37 154 613 62 540 535 764 546 190 645 229 798 917 959 915 516 27 459 786 549 850 141 404 868 285 231 887 442 978 402 589 463 842 898 54 355 395 745 947 320 446 206 364 785 806 185 623 409 910 665 632 276 505 631 475 457 567 192 856 168 414 606 425 904 150 139 86 100 91 918 237 362 152 353 778 687 130 847 878 722 434 375 900 938 146 481 409 395 725 469 843 832 517 671 810 176 153 96 410 982 207 382 514 451 440 679 178 515 897 657 605 789 306 72 144 127 2 610 317 814 953 10 870 985 987 160 833 29 647 365 797 733 945 177 785 149 95 245 505 718 496 537 112 689 170 161 824 859 871 706 143 390 402 2 398 155 418 171 467 472 32 422 479 438 245 198 412 876 424 619 96 467 828 889 636 642 633 894 847 832 704 998 86 603 201 241 841 786 207 948 215 173 379 597 366 388 9 724 418 99 769 558 669 301 852 850 85 530 845 662 336 127 40 719 720 749 558 629 399 146 26 719 98 265 902 747 249 956 611 346 97 147 629 984 81 443 816 548 118 914 654 563 616 968 535 482 145 372 886 782 679 608 560 466 593 122 940 525 416 432 90 800 52 108 884 53 139 556 881 885 787 191 935 216 606 687 341 992 122 522 379 974 46 882 10 914 726 480 530 953 826 856 597 80 675 719 57 511 527 486 217 333 722 685 555 993 144 989 624 975 779 618 997 902 286 779 108 554 866 764 234 192 746 68 553 59 905 88 606 54 640 823 986 488 154 382 10 329 859 918 278 822 309 368 751 596 521 32 489 569 337 969 225 933 523 458 569 581 560 996 460 568 731 516 568 695 671 930 148 167 634 49 523 688 694 53 346 843 660 815 855 907 632 729 751 212 581 597 886 819 609 371 576 344 591 790 145 135 199 141 283 607 679 38 895 219 518 648 556 996 348 621 425 599 346 177 248 208 164 64 886 821 410 65 481 495 518 587 181 358 733 594 422 684 368 891 144 164 417 32 20 425 236 63 893 419 955 126 788 28 638 596 199 51 130 188 525 660 710 383 286 334 49 558 193 255 777 395 289 298 417 172 437 723 416 482 292 131 352 879 970 185 343 468 682 874 881 400 419 307 958 680 801 699 538 315 767 27 770 126 449 625 354 891 12 763 393 567 164 909 410 356 915 929 234 353 983 541 197 995 271 336 184 644 682 800 844 913 440 482 614 38 901 839 729 444 970 982 723 581 100 491 175 982 842 687 499 625 977 35 347 116 870 782 181 835 474 763 974 348 30 246 2 929 405 708 444 450 279 602 537 458 12 595 946 585 988 978 894 918 8 739 366 693 419 336 596 197 396 627 975 109 727 939 487 745 559 104 531 371 470 981 421 30 551 168 161 880 296 184 881 619 740 46 569 559 672 120 633 238 965 537 730 203 588 795 267 591 388 556 99 108 490 858 947 829 43 77 209 498 221 600 588 219 947 212 678 937 104 155 152 666 432 359 988 642 77 26 71 118 528 687 306 284 414 146 300 391 969 604 874 520 635 686 218 463 893 840 327 212 724 282 39 547 677 410 404 374 868 989 392 774 52 798 639 540 772 830 591 681 135 727 607 904 583 878 298 159 33 242 85 320 949 131 791 416 467 404 658 420 603 829 965 755 878 633 453 327 592 79 271 95 52 378 175 655 491 262 557 204 55 214 829 653 894 518 135 923 787 616 725 976 313 429 523 296 732 505 913 988 7 136 323 105 216 785 710 932 67 90 609 588 85 620 145 93 588 434 160 239 815 346 511 727 266 520 357 41 671 545 871 755 335 250 289 23 176 175 172 787 212 894 833 247 866 136 873 577 102 249 639 69 536 967 402 466 465 50 514 398 24 307 155 291 4 928 458 332 950 512 315 482 377 220 114 505 370 452 626 850 948 497 222 233 228 595 475 643 252 403 950 352 261 387 921 395 483 339 89 622 790 408 257 396 23 70 1 461 27 72 689 568 955 875 511 395 906 363 430 261 343 269 890 259 148 762 36 875 904 849 314 556 764 448 668 986 461 44 183 444 517 138 785 258 757 934 310 689 682 586 74 496 194 933 738 354 58 499 816 308 967 174 672 950 3 201 585 703 798 904 592 21 723 802 399 256 960 865 304 846 650 581 36 368 732 149 908 182 6 691 854 182 961 75 808 550 854 962 812 25 192 960 188 6 943 257 363 426 930 420 497 548 7 334 984 516 255 613 262 381 338 916 150 910 937 176 169 936 968 383 547 505 362 612 317 138 829 152 434 615 170 535 123 195 72 108 506 250 51 970 651 628 896 684 732 652 414 443 59 951 809 193 81 113 968 337 652 440 927 227 533 621 271 603 602 522 163 363 395 918 923 954 875 779 830 450 593 713 290 852 929 546 362 976 122 950 470 125 877 408 50 192 856 784 89 571 948 205 601 161 241 962 789 531 30 256 333 912 76 942 919 799 678 114 477 827 182 687 798 673 678 114 355 273 622 929 165 714 54 285 987 980 12 661 172 140 502 725 265 136 197 596 305 343 448 537 860 501 665 521 68 264 892 651 659 776 802 211 253 554 865 622 904 669 980 214 196 272 160 369 416 368 877 58 836 740 648 498 669 618 477 466 238 483 819 58 568 516 504 281 489 942 881 287 692 653 522 218 765 418 915 981 777 185 655 471 9 26 349 62 228 470 234 40 774 615 709 596 321 376 557 966 377 536 325 914 811 673 801 924 932 500 512 510 953 429 923 750 155 332 974 690 489 838 489 764 552 616 93 82 578 251 738 644 268 961 171 786 148 197 364 766 217 303",
        expected: "583732",
      },
    ],
    hints: [
      "Look at the last hour only. Either it is sponsored or it is not.",
      "If it is sponsored, the hour before it cannot be, so the rest of the total comes from everything up to two hours back.",
      "best(i) = max(best(i - 1), best(i - 2) + bids[i]). Plain recursion on this recomputes the same hours over and over.",
      "Fill the answers from the first hour forward. Each one needs only the previous two, so two variables are enough.",
    ],
    solutions: [
      {
        title: "Brute force: try both choices at every hour",
        order: 1,
        intuition:
          "At each hour you either sponsor it, which forces you to jump past its neighbour, or you leave it and move on. Exploring both branches from every hour covers every legal schedule, but the same suffix of hours is solved again and again, so the work doubles with every few hours added.",
        approach: [
          "Define bestFrom(i) as the most money available from hour i to the end.",
          "If i is past the last hour, return 0.",
          "Otherwise return the larger of bestFrom(i + 1) and bids[i] + bestFrom(i + 2).",
          "The answer is bestFrom(0).",
        ],
        code: {
          PYTHON: `def maxSponsorRevenue(bids: List[int]) -> int:
    def best_from(i: int) -> int:
        if i >= len(bids):
            return 0
        skip = best_from(i + 1)
        take = bids[i] + best_from(i + 2)  # the neighbour must be skipped
        return max(skip, take)

    return best_from(0)`,
          JAVA: `class Solution {
    private int[] bids;

    public int maxSponsorRevenue(int[] bids) {
        this.bids = bids;
        return bestFrom(0);
    }

    private int bestFrom(int i) {
        if (i >= bids.length) return 0;
        int skip = bestFrom(i + 1);
        int take = bids[i] + bestFrom(i + 2);
        return Math.max(skip, take);
    }
}`,
        },
        timeComplexity: "O(φⁿ) — exponential",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: [
          "No hours at all, which earns 0.",
          "A single hour, which is simply taken.",
        ],
        commonMistakes: [
          "Recursing to i + 1 after taking hour i, which lets two neighbours both be sponsored.",
          "Running this on a long schedule: it repeats the same subproblems exponentially often.",
        ],
      },
      {
        title: "Optimal: rolling best totals",
        order: 2,
        intuition:
          "The recursion only ever asks about a suffix (or, filled forwards, a prefix) of the hours, so there are just n distinct subproblems. Solving them from the front, the best total up to hour i depends only on the best totals up to hours i - 1 and i - 2. Keep those two numbers and slide them along.",
        approach: [
          "Keep bestBeforePrev (best up to two hours back) and bestPrev (best up to the previous hour), both 0 at the start.",
          "For each bid, the best up to this hour is max(bestPrev, bestBeforePrev + bid).",
          "Shift: bestBeforePrev becomes bestPrev, and bestPrev becomes the new value.",
          "After the last hour, bestPrev is the answer.",
        ],
        code: {
          PYTHON: `def maxSponsorRevenue(bids: List[int]) -> int:
    # best_before_prev: best total using hours up to i - 2
    # best_prev:        best total using hours up to i - 1
    best_before_prev, best_prev = 0, 0

    for bid in bids:
        best_here = max(best_prev, best_before_prev + bid)
        best_before_prev, best_prev = best_prev, best_here

    return best_prev`,
          JAVA: `class Solution {
    public int maxSponsorRevenue(int[] bids) {
        int bestBeforePrev = 0; // best using hours up to i - 2
        int bestPrev = 0;       // best using hours up to i - 1

        for (int bid : bids) {
            int bestHere = Math.max(bestPrev, bestBeforePrev + bid);
            bestBeforePrev = bestPrev;
            bestPrev = bestHere;
        }

        return bestPrev;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "An empty schedule returns 0 without entering the loop.",
          "All bids equal: the best plan alternates.",
          "Two large bids separated by two small ones: both large bids can be taken.",
        ],
        commonMistakes: [
          "Assuming the answer is just the sum of the even or the odd positions; gaps of two or more are often better.",
          "Overwriting bestPrev before computing the new value from it.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "stepping-stone-toll",
    title: "Stepping Stone Toll",
    difficulty: "EASY",
    learningObjective:
      "Define the cost of reaching each position from the two positions that can lead to it, and take the cheaper.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A garden path crosses a pond on a line of stepping stones. A caretaker charges a toll for every stone you land on. You start on the near bank, just before the first stone, and want to reach the far bank, just after the last stone."
      ),
      para(
        "Each hop moves you forward by exactly one or two positions. The banks are free. Return the smallest total toll for the crossing."
      ),
      example(
        "tolls = [4, 9, 2, 7, 3]",
        "9",
        [
          {
            state: "stone 0: 4 + min(bank, bank) = 4",
            note: "reached straight from the bank",
          },
          {
            state: "stone 1: 9 + min(4, bank 0) = 9",
            note: "cheapest to hop over stone 0",
          },
          { state: "stone 2: 2 + min(9, 4) = 6", note: "come from stone 0" },
          { state: "stone 3: 7 + min(6, 9) = 13", note: "come from stone 2" },
          { state: "stone 4: 3 + min(13, 6) = 9", note: "come from stone 2" },
          { state: "far bank: min(9, 13) = 9", note: "leave from stone 4 or stone 3" },
        ],
        "Cheapest cost to stand on each stone"
      ),
    ],
    constraints: ["1 ≤ tolls.length ≤ 100000", "0 ≤ tolls[i] ≤ 1000"],
    signature: {
      params: ["int[]"],
      paramNames: ["tolls"],
      returns: "int",
      functionName: "minStoneToll",
    },
    tests: [
      {
        input: "4 9 2 7 3",
        expected: "9",
        isSample: true,
        explanation:
          "Bank, stone 0 (4), stone 2 (2), stone 4 (3), far bank: 9 in tolls.",
      },
      {
        input: "10 1 10 1 10",
        expected: "2",
        isSample: true,
        explanation: "Land only on the two 1s: bank, stone 1, stone 3, far bank.",
      },
      { input: "5", expected: "0" },
      { input: "3 3", expected: "3" },
      { input: "0 0 0 0", expected: "0" },
      { input: "1 100 1 1 100 1", expected: "4" },
      { input: "7 7 7 7 7 7 7", expected: "21" },
      {
        input:
          "430 179 297 34 631 512 472 243 394 923 981 535 891 649 462 139 720 116 322 216 127 478 438 20 570 973 244 436 99 608 414 571 397 756 533 899 309 46 822 37 393 242 403 646 123 267 141 58 441 997 534 530 951 819 161 722 747 720 384 932 842 935 307 266 904 467 536 217 664 340 603 234 580 385 8 292 404 910 694 434 275 360 4 641 882 724 736 851 983 396 516 587 319 471 741 874 910 667 921 151 883 995 968 663 568 193 890 922 514 132 712 267 939 958 371 778 243 281 395 116 764 888 743 495 845 832 161 889 456 501 265 249 32 855 609 130 682 903 749 526 253 528 821 741 878 207 822 492 822 261 121 434 173 656 783 159 945 153 257 665 69 661 584 909 652 765 802 404 522 809 767 526 605 949 333 809 742 624 698 465 597 395 136 209 109 74 536 66 999 20 987 853 860 423 815 493 511 146 857 370 890 322 167 55 859 455 913 313 357 92 776 735 592 801 313 49 481 163 434 464 226 91 927 55 305 675 165 819 537 347 174 598 248 792 669 105 959 832 206 985 782 651 825 283 605 658 229 496 28 231 574 84 659 221 88 917 238 17 598 866 301 641 923 921 25 989 310 694 420 400 299 717 287 129 981 186 589 912 397 127 853 126 740 325 126 409 344 44 405 962 840 754 799 820 237 395 65 776 138 564 87 29 372 860 695 937 822 242 613 561 858 979 12 212 711 73 107 760 642 938 79 852 157 172 582 277 190 779 983 675 298 722 546 984 135 547 661 619 419 621 466 415 774 135 765 123 647 46 943 409 483 968 259 206 662 664 1 265 645 849 732 25 727 435 772 560 118 802 273 566 751 844 8 296 969 400 547 280 92 513 109 305 973 656 24 546 319 34 567 775 753 147 204 334 745 341 931 642 647 155 799 376 427 996 844 6 993 798 544 397 644 812 11 897 722 70 802 713 856 814 636 949 520 477 477 968 234 260 285 550 359 240 612 96 752 991 430 411 305 354 53 338 766 21 949 690 250 378 856 202 58 343 745 621 33 704 876 705 229 754 821 734 657 165 814 278 500 316 871 66 945 158 398 836 104 405 375 310 988 791 485 454 848 664 174 282 624 274 588 753 217 935 437 129 291 582 272 379 240 91 202 811 351 104 174 738 964 119 645 108 982 627 319 781 678 812 790 286 828 920 124 693 828 329 694 226 483 885 339 867 516 877 434 543 184 206 811 670 977 975 949 148 79 183 478 239 209 327 785 353 848 832 896 752 127 532 635 514 613 581 667 304 610 923 503 807 902 173 101 753 848 84 238 168 683 631 345 477 697 718 762 385 680 432 569 493 57 608 338 264 395 814 508 726 171 290 68 38 41 923 468 351 595 628 364 799 68 587 640 49 179 733 956 87 88 785 484 606 827 260 303 945 991 156 47 254 569 886 999 96 840 150 212 497 291 435 737 676 975 806 735 65 423 702 885 330 600 989 304 606 707 549 720 875 495 434 298 460 368 926 776 397 153 636 132 833 458 565 49 30 265 501 1 195 843 153 763 893 204 570 321 910 269 680 657 103 962 86 977 110 806 637 100 330 697 425 88 385 730 375 55 665 253 862 416 629 386 243 837 647 12 862 93 732 42 98 715 102 992 591 667 163 900 751 904 552 364 264 303 370 472 924 125 551 374 893 116 789 299 955 903 324 623 747 55 636 1 762 549 734 491 369 725 579 587 961 432 817 738 667 719 446 960 792 936 753 528 305 871 16 112 619 54 276 500 639 817 443 378 185 402 480 421 807 846 292 590 601 429 175 927 319 202 789 393 452 826 504 103 474 192 660 157 465 274 201 732 312 329 607 260 911 931 785 148 330 273 739 684 135 18 577 445 6 377 404 8 978 76 467 902 289 566 752 25 744 935 378 579 853 416 78 343 713 400 657 611 481 373 185 354 896 345 449 732 675 179 370 46 791 73 342 313 473 588 4 807 951 486 790 8 904 183 647 833 148 896 411 139 939 467 378 675 606 959 163 100 590 100 416 352 635 122 781 106 324 727 768 877 379 350 599 4 773 296 434 844 288 200 780 732 323 412 241 1 248 616 966 555 954 254 257 177 203 118 228 535 702 320 365 849 118 839 193 635 421 631 234 819 633 953 427 789 688 876 905 666 244 708 561 344 550 392 517 86 805 795 438 654 85 345 705 195 301 599 512 741 304 358 615 176 201 847 736 536 74 470 786 741 323 790 998 387 229 414 550 663 289 740 483 422 22 167 31 196 803 459 43 848 835 104 534 264 501 709 296 814 623 582 657 791 31 547 6 481 750 546 945 858 226 425 114 762 226 40 544 69 733 780 537 983 370 929 970 81 782 679 964 996 82 209 415 854 613 697 94 116 888 766 899 724 788 167 553 809 6 752 398 127 492 269 565 140 904 650 268 656 19 796 654 761 196 312 645 430 966 419 787 509 912 948 537 795 486 293 325 12 272 400 414 997 128 915 532 37 51 360 759 163 409 620 379 410 946 917 71 723 95 457 487 691 566 397 655 503 991 95 190 528 230 469 581 913 902 212 665 991 477 697 715 607 935 300 31 606 844 995 735 712 497 562 100 17 824 570 551 272 421 729 564 839 885 164 161 573 40 409 359 299 472 299 423 869 62 115 354 303 450 999 665 49 520 748 672 753 840 253 567 420 312 293 568 311 273 851 509 614 981 130 640 756 175 793 16 781 253 333 221 563 84 745 234 993 331 336 858 24 86 350 584 323 512 496 529 731 991 728 87 62 110 718 367 927 175 391 321 212 225 820 975 256 995 259 678 959 11 790 268 926 264 14 434 130 277 164 558 8 340 503 450 778 223 7 51 111 1 477 508 576 771 404 284 678 465 997 815 640 884 788 902 752 392 510 201 618 700 966 828 299 801 441 351 708 25 655 956 296 512 425 140 425 963 71 271 102 587 858 550 850 161 189 869 675 523 57 673 911 424 761 667 212 354 540 873 607 4 10 726 666 50 254 588 463 957 278 84 370 205 345 68 316 866 907 188 127 492 933 365 192 839 582 579 844 308 789 517 266 47 897 366 859 571 309 866 808 168 303 360 957 148 26 89 205 841 260 840 985 397 122 987 103 922 940 837 779 886 704 579 740 581 364 161 173 517 553 829 697 667 670 212 738 913 684 580 316 171 631 892 331 310 579 298 451 613 122 887 660 706 457 277 939 752 214 358 42 286 847 424 924 707 825 350 904 324 170 986 209 791 473 183 101 865 291 707 750 687 672 356 691 712 452 929 283 242 517 107 222 476 847 233 262 827 32 457 650 412 892 897 427 987 491 731 804 965 709 767 292 359 808 521 255 903 155 876 792 748 751 767 688 266 849 762 262 239 836 207 0 780 674 615 272 151 329 62 364 736 200 174 219 514 549 906 382 323 746 180 769 276 840 365 887 651 346 430 264 198 985 391 152 402 751 168 319 88 440 318 507 130 930 82 554 707 722 645 429 47 840 292 252 204 358 605 803 66 209 285 819 191 673 285 643 493 539 159 71 731 646 430 504 791 999 126 962 497 786 231 668 708 103 30 610 543 47 621 191 283 997 505 529 640 878 468 804 249 332 492 817 929 733 77 669 274 296 898 449 913 766 102 327 594 227 701 271 826 855 171 159 487 520 694 350 70 395 57 343 772 22 486 117 763 970 317 740 818 847 114 604 575 205 349 320 589 542 990 704 522 941 330 505 996 494 501 38 118 89 436 258 701 110 868 263 541 592 370 827 276 806 289 880 585 808 529 236 842 197 492 815 871 630 372 891 555 744 636 467 75 549 551 52 872 432 209 948 713 356 737 576 575 745 322 333 357 4 611 430 420 546 185 602 156 496 389 537 723 898 327 286 180 378 327 30 958 886 736 396 464 400 935 121 735 189 516 664 713 308 532 338 212 850 829 821 480 429 408 517 324 961 298 374 411 695 167 39 682 532 824 452 196 855 917 718 650 588 510 505 927 68 687 377 3 61 312 295 907 46 895 344 466 642 758 909 960 62 894 818 73 490 13 409 438 402 730 158 113 44 133 262 742 365 246 171 770 561 883 570 138 363 262 773 54 317 722 887 127 269 650 575 367 538 67 87 270 650 639 997 78 296 486 483 131 720 924 434 427 69 616 835 141 872 907 305 110 335 588 148 722 487 100 477 810 755 621 212 362 704 933 204 821 418 713 749 824 595 865 394 135 186 705 399 593 704 960 850 959 64 959 277 996 570 88 269 786 194 688 25 252 425 418 341 37 991 569 870 151 667 513 304 648 939 550 431 483 703 612 35 506 979 436 268 415 884 680 886 33 805 458 242 449 395 383 848 358 216 488 646 127 162 451 2 335 343 618 297 249 805 978 790 615 427 995 235 522 835 962 974 480 477 48 568 866 818 953 133 654 159 513 259 671 971 9 819 471 637 49 948 992 457 611 217 931 397 139 432 759 311 643 610 41 962 45 201 997 844 928 393 112 800 72 442 791 756 671 432 820 959 900 32 941 273 926 492 818 149 619 221 15 685 179 329 73",
        expected: "414525",
      },
    ],
    hints: [
      "Which positions can you arrive at stone i from?",
      "Only from stone i - 1 or stone i - 2 (or the bank, when those do not exist).",
      "cost(i) = tolls[i] + min(cost(i - 1), cost(i - 2)), with the bank costing 0.",
      "The far bank is reached from either of the last two stones; you only need two running values.",
    ],
    solutions: [
      {
        title: "Brute force: recurse on every hop",
        order: 1,
        intuition:
          "From any position you can hop one or two forward, so try both and keep the cheaper. This explores every possible crossing, which is correct but repeats the same stones many times.",
        approach: [
          "Define cheapestFrom(i) as the cheapest toll from standing on stone i to the far bank, including stone i's toll.",
          "Past the last stone, the cost is 0.",
          "Otherwise it is tolls[i] + min(cheapestFrom(i + 1), cheapestFrom(i + 2)).",
          "From the bank you can land on stone 0 or stone 1, so return the smaller of those two.",
        ],
        code: {
          PYTHON: `def minStoneToll(tolls: List[int]) -> int:
    def cheapest_from(i: int) -> int:
        if i >= len(tolls):
            return 0  # on the far bank
        return tolls[i] + min(cheapest_from(i + 1), cheapest_from(i + 2))

    return min(cheapest_from(0), cheapest_from(1))`,
          JAVA: `class Solution {
    private int[] tolls;

    public int minStoneToll(int[] tolls) {
        this.tolls = tolls;
        return Math.min(cheapestFrom(0), cheapestFrom(1));
    }

    private int cheapestFrom(int i) {
        if (i >= tolls.length) return 0;
        return tolls[i] + Math.min(cheapestFrom(i + 1), cheapestFrom(i + 2));
    }
}`,
        },
        timeComplexity: "O(φⁿ) — exponential",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["A single stone, which can be hopped over entirely."],
        commonMistakes: [
          "Forcing the crossing to land on stone 0; the first hop may skip it.",
          "Forcing the crossing to land on the last stone; you may hop off from the second-to-last.",
        ],
      },
      {
        title: "Optimal: two rolling costs",
        order: 2,
        intuition:
          "Going forwards, the cheapest way to stand on stone i depends only on the cheapest ways to stand on the two stones before it. Treat the bank as a position that costs nothing; because tolls are never negative, standing 'two before' stone 0 on the bank is just as free. Two variables then carry the whole table.",
        approach: [
          "Set twoBack and oneBack to 0: the bank.",
          "For each toll, the cost to stand on this stone is toll + min(oneBack, twoBack).",
          "Shift the pair forwards.",
          "The far bank is one or two hops past the last two stones, so return min(oneBack, twoBack).",
        ],
        code: {
          PYTHON: `def minStoneToll(tolls: List[int]) -> int:
    # Cheapest cost to stand two positions back and one position back.
    # Both start on the bank, which is free.
    two_back, one_back = 0, 0

    for toll in tolls:
        here = toll + min(one_back, two_back)
        two_back, one_back = one_back, here

    # Hop to the far bank from either of the last two stones.
    return min(one_back, two_back)`,
          JAVA: `class Solution {
    public int minStoneToll(int[] tolls) {
        int twoBack = 0, oneBack = 0; // both start on the free bank

        for (int toll : tolls) {
            int here = toll + Math.min(oneBack, twoBack);
            twoBack = oneBack;
            oneBack = here;
        }

        return Math.min(oneBack, twoBack);
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "One stone: hop straight from bank to bank for 0.",
          "Expensive stones alternating with cheap ones: only the cheap ones are used.",
          "All tolls zero.",
        ],
        commonMistakes: [
          "Returning oneBack alone, which forces the last stone to be used.",
          "Initialising the bank with a large sentinel and then adding to it, which overflows in Java.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "roadworks-grid-routes",
    title: "Routes Around the Roadworks",
    difficulty: "EASY",
    learningObjective:
      "Count paths in a grid by adding the counts from the cells that feed each cell, zeroing out blocked cells.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A bike courier crosses a district laid out as a grid of blocks. She starts at the top-left block and must deliver to the bottom-right block. To keep to one-way cycle lanes, every move goes either one block east (right) or one block south (down)."
      ),
      rich(
        "Some blocks are closed for roadworks: ",
        { code: "grid[r][c] = 1" },
        " means closed, ",
        { code: "0" },
        " means open. Return how many different routes reach the destination using only open blocks. If the start or the destination is closed, there are no routes."
      ),
      example(
        "grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]",
        "2",
        [
          { state: "row 0: 1 1 1", note: "only reachable by going east" },
          { state: "row 1: 1 0 1", note: "the closed centre contributes nothing" },
          { state: "row 2: 1 1 2", note: "each cell = from above + from the left" },
        ],
        "Routes to each block"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 16",
      "grid[r][c] is 0 (open) or 1 (closed)",
      "The answer fits in a 32-bit signed integer.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["grid"],
      returns: "int",
      functionName: "countOpenRoutes",
    },
    tests: [
      {
        input: "3\n0 0 0\n0 1 0\n0 0 0",
        expected: "2",
        isSample: true,
        explanation:
          "With the centre closed, only the route along the top and the route down the left side remain.",
      },
      {
        input: "3\n0 0 0 0\n0 0 1 0\n1 0 0 0",
        expected: "3",
        isSample: true,
        explanation: "Three routes steer around the two closed blocks.",
      },
      { input: "1\n0", expected: "1" },
      { input: "1\n1", expected: "0" },
      { input: "2\n0 0\n0 1", expected: "0" },
      { input: "1\n0 1 0 0 0", expected: "0" },
      { input: "4\n0\n0\n0\n0", expected: "1" },
      {
        input: "5\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0",
        expected: "70",
      },
      { input: "3\n0 0\n1 1\n0 0", expected: "0" },
      {
        input:
          "16\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
        expected: "51780704",
      },
    ],
    hints: [
      "Every route into a block arrives from the block above or the block to its left.",
      "So routes(r, c) = routes(r - 1, c) + routes(r, c - 1) for an open block, and 0 for a closed one.",
      "Fill the table row by row, left to right, so both sources are ready before you need them.",
      "The row above is only needed once: a single array updated in place holds everything.",
    ],
    solutions: [
      {
        title: "Brute force: walk every route",
        order: 1,
        intuition:
          "From each block, try going south and try going east, and count the walks that reach the destination. It mirrors the rules exactly but enumerates each route one at a time, and the number of routes grows exponentially with the grid size.",
        approach: [
          "Recurse from (r, c). Off the grid or on a closed block, return 0.",
          "At the destination, return 1.",
          "Otherwise return the routes going south plus the routes going east.",
        ],
        code: {
          PYTHON: `def countOpenRoutes(grid: List[List[int]]) -> int:
    rows, cols = len(grid), len(grid[0])

    def walk(r: int, c: int) -> int:
        if r >= rows or c >= cols or grid[r][c] == 1:
            return 0
        if r == rows - 1 and c == cols - 1:
            return 1
        return walk(r + 1, c) + walk(r, c + 1)

    return walk(0, 0)`,
          JAVA: `class Solution {
    private int[][] grid;

    public int countOpenRoutes(int[][] grid) {
        this.grid = grid;
        return walk(0, 0);
    }

    private int walk(int r, int c) {
        if (r >= grid.length || c >= grid[0].length || grid[r][c] == 1) return 0;
        if (r == grid.length - 1 && c == grid[0].length - 1) return 1;
        return walk(r + 1, c) + walk(r, c + 1);
    }
}`,
        },
        timeComplexity: "O(2^(rows + cols))",
        spaceComplexity: "O(rows + cols) recursion depth",
        edgeCases: ["A closed start, which returns 0 on the very first call."],
        commonMistakes: [
          "Checking for the destination before checking whether it is closed.",
        ],
      },
      {
        title: "Optimal: one row of running counts",
        order: 2,
        intuition:
          "The number of routes into a block depends only on its top and left neighbours. Filling the grid in reading order guarantees both are known. Better still, before the update ways[c] still holds the count for the block above, and ways[c - 1] already holds the new count for the block to the left, so one array is enough.",
        approach: [
          "Create ways with one entry per column; ways[0] is 1 if the start is open, else 0.",
          "For each row, sweep the columns left to right.",
          "A closed block sets ways[c] to 0.",
          "An open block with c > 0 adds ways[c - 1] (from the left) to ways[c] (from above).",
          "Return ways[cols - 1] after the last row.",
        ],
        code: {
          PYTHON: `def countOpenRoutes(grid: List[List[int]]) -> int:
    cols = len(grid[0])
    # ways[c] = routes into column c of the row being processed.
    ways = [0] * cols
    ways[0] = 1 if grid[0][0] == 0 else 0

    for row in grid:
        for c in range(cols):
            if row[c] == 1:
                ways[c] = 0  # roadworks: nothing passes through
            elif c > 0:
                ways[c] += ways[c - 1]  # from above (old) + from the left (new)

    return ways[cols - 1]`,
          JAVA: `class Solution {
    public int countOpenRoutes(int[][] grid) {
        int cols = grid[0].length;
        int[] ways = new int[cols];
        ways[0] = grid[0][0] == 0 ? 1 : 0;

        for (int[] row : grid) {
            for (int c = 0; c < cols; c++) {
                if (row[c] == 1) {
                    ways[c] = 0;
                } else if (c > 0) {
                    ways[c] += ways[c - 1];
                }
            }
        }

        return ways[cols - 1];
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(cols)",
        edgeCases: [
          "A single open block: one route, taking no moves.",
          "A closed destination: the last write to ways[cols - 1] is 0.",
          "A full row of closures cuts the grid in two, and every count below it is 0.",
        ],
        commonMistakes: [
          "Initialising the whole first row and column to 1 without checking for closures beyond them.",
          "Forgetting that a closure in the first column blocks every block below it.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(cols)",
  },

  {
    slug: "lightest-grid-route",
    title: "Lightest Route Across the Floor",
    difficulty: "EASY",
    learningObjective:
      "Replace 'count the ways' with 'keep the cheapest way' in a grid recurrence, handling the border rows and columns.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A warehouse robot drives from the loading dock in the top-left cell of the floor to the packing station in the bottom-right cell. Every cell has a congestion delay in seconds, and the robot pays the delay of every cell it occupies, including the first and the last."
      ),
      para(
        "The robot can only move one cell right or one cell down at a time. Return the smallest total delay of any route."
      ),
      example(
        "grid = [[2, 7, 1], [3, 1, 4], [6, 2, 1]]",
        "9",
        [
          { state: "row 0: 2 9 10", note: "only reachable from the left" },
          { state: "row 1: 5 6 10", note: "6 = 1 + min(9, 5)" },
          { state: "row 2: 11 8 9", note: "9 = 1 + min(10, 8)" },
          { state: "route 2 → 3 → 1 → 2 → 1", note: "down, right, down, right" },
        ],
        "Lightest delay to reach each cell"
      ),
    ],
    constraints: ["1 ≤ rows, cols ≤ 200", "0 ≤ grid[r][c] ≤ 100"],
    signature: {
      params: ["int[][]"],
      paramNames: ["grid"],
      returns: "int",
      functionName: "lightestRoute",
    },
    tests: [
      {
        input: "3\n2 7 1\n3 1 4\n6 2 1",
        expected: "9",
        isSample: true,
        explanation: "2, 3, 1, 2, 1 (down, right, down, right) totals 9.",
      },
      {
        input: "2\n5 1\n1 5",
        expected: "11",
        isSample: true,
        explanation: "Both routes pass one of the 5s: 5 + 1 + 5 or 5 + 1 + 5.",
      },
      { input: "1\n4", expected: "4" },
      { input: "1\n1 2 3 4", expected: "10" },
      { input: "3\n1\n2\n3", expected: "6" },
      { input: "2\n0 0 0\n0 0 0", expected: "0" },
      { input: "3\n1 9 9 9\n1 1 1 9\n9 9 1 1", expected: "6" },
      {
        input:
          "40\n28 54 5 25 63 23 47 36 69 28 27 87 45 68 35 68 72 56 50 69 59 96 5 27 75 58 77 95 61 17 32 30 33 33 90 49 54 45 41 60\n82 14 75 43 34 59 21 15 31 38 65 99 51 57 84 77 28 46 91 99 64 84 94 27 62 43 36 49 36 36 90 15 52 72 6 6 31 96 27 36\n36 1 48 17 42 89 92 0 95 14 66 81 72 1 16 89 78 21 91 10 96 19 61 66 7 37 33 94 8 46 23 10 11 29 53 64 20 30 86 25\n77 32 13 8 66 22 10 56 28 35 60 81 12 68 56 75 3 11 66 80 36 21 45 66 79 0 23 8 70 59 42 65 24 45 18 83 19 97 0 96\n45 5 78 45 35 82 52 68 94 46 44 59 67 46 83 14 50 28 54 60 39 46 53 81 26 55 89 42 43 94 94 30 69 95 63 82 87 58 24 42\n21 78 23 19 41 20 49 13 15 52 81 94 27 46 85 47 75 40 18 58 51 31 65 13 76 41 46 95 44 39 80 28 68 90 62 68 18 23 38 3\n36 14 54 94 99 90 55 74 9 52 61 6 4 7 96 89 31 53 97 85 26 75 30 21 83 11 48 85 8 16 50 54 62 55 22 19 25 58 57 73\n16 42 43 4 44 1 99 59 55 59 56 68 41 14 14 78 89 5 30 64 52 39 68 39 60 67 8 77 53 87 81 23 44 81 36 59 27 44 75 43\n67 11 77 14 94 7 9 54 5 49 60 64 12 37 51 2 58 0 48 46 41 87 30 80 46 29 11 33 31 86 62 2 42 59 28 27 23 87 52 54\n80 88 3 10 76 29 59 28 30 5 88 45 96 66 31 32 5 63 7 98 40 43 15 58 76 10 8 28 7 85 31 17 94 36 67 85 62 15 40 40\n54 73 11 83 10 11 85 29 22 55 36 85 19 40 90 98 16 92 30 77 82 35 67 51 24 81 97 63 55 73 9 18 33 74 94 63 17 97 30 38\n46 57 56 20 76 74 96 67 66 42 68 39 82 83 69 69 46 29 88 50 94 28 41 62 21 65 42 2 49 22 70 85 26 37 47 42 35 93 53 58\n40 17 23 21 35 64 60 55 34 57 83 63 49 35 49 39 52 12 76 77 42 97 81 3 73 16 33 17 99 54 71 96 46 85 30 18 14 31 88 78\n29 56 8 69 69 62 81 86 15 17 92 75 73 45 65 45 85 97 54 13 3 84 12 38 58 99 16 51 72 0 55 4 22 80 15 52 49 7 50 93\n93 57 48 99 57 94 16 78 30 29 93 57 93 53 54 50 24 19 20 58 57 48 23 23 72 8 92 85 47 55 84 90 70 68 63 15 88 33 58 48\n37 38 97 60 55 30 76 63 54 98 36 63 31 74 59 32 54 67 62 76 4 74 40 81 26 12 76 97 53 82 30 14 65 44 38 50 31 27 4 28\n89 66 6 44 83 47 54 70 9 13 75 22 71 91 95 88 31 80 48 95 68 47 5 95 88 36 55 73 69 22 48 33 1 6 8 93 92 40 18 51\n39 11 99 54 45 55 80 81 28 60 38 12 47 15 3 73 27 64 95 10 12 78 3 50 27 99 23 64 93 5 78 17 68 95 61 65 27 60 26 71\n3 3 40 1 32 24 78 38 86 23 51 27 75 15 82 46 61 57 90 28 95 43 15 45 22 10 79 60 22 84 36 62 97 47 55 24 16 46 35 17\n96 52 63 68 20 31 68 81 98 59 31 10 20 44 46 91 64 2 11 14 56 6 52 28 58 71 48 71 5 62 33 83 72 6 76 87 50 85 22 16\n60 23 77 6 36 46 44 85 82 2 89 27 9 69 66 51 5 6 14 15 39 71 60 68 62 87 28 80 17 99 64 25 4 40 52 13 88 16 25 4\n96 55 43 64 45 88 38 53 36 24 2 64 65 71 82 81 92 90 52 37 11 92 48 35 99 33 27 61 46 31 22 74 16 71 92 62 26 94 46 33\n22 73 44 71 43 36 13 66 58 81 19 88 71 53 60 22 99 82 71 55 16 57 86 56 7 54 87 14 63 63 95 49 89 69 44 72 68 10 82 89\n70 33 85 49 56 67 52 80 20 96 76 66 2 58 61 33 0 64 46 0 56 62 49 16 92 72 3 14 71 19 27 42 17 40 15 61 3 75 30 96\n52 52 27 26 47 87 63 44 30 36 11 99 19 52 91 41 59 29 62 82 10 84 68 97 19 78 55 16 67 85 51 32 27 72 0 98 6 65 23 76\n2 59 84 75 6 18 98 42 68 59 90 77 54 50 99 34 51 70 50 49 53 3 34 17 27 84 89 46 69 8 33 44 94 90 82 36 63 95 56 75\n18 90 72 34 97 61 33 32 0 59 39 58 63 64 17 81 78 4 37 86 7 2 33 2 13 67 31 48 73 3 85 48 40 9 30 49 34 32 81 40\n14 39 5 64 24 70 47 26 42 65 99 65 94 57 67 43 78 75 48 80 62 69 47 66 88 71 28 11 18 53 17 36 63 59 30 65 97 4 3 99\n3 30 50 41 4 30 49 51 17 44 4 45 80 19 60 24 93 44 28 69 32 86 67 64 34 63 2 55 31 66 84 96 17 50 1 73 72 54 5 91\n92 41 87 31 11 47 16 89 98 21 11 71 50 77 32 49 41 27 26 94 94 57 61 86 25 92 44 89 89 12 98 4 72 24 2 63 39 74 2 79\n88 25 38 79 56 57 62 8 10 90 92 66 68 5 77 19 9 37 95 1 56 71 15 35 68 91 40 4 64 6 13 44 64 79 18 98 43 66 10 66\n93 96 55 78 95 22 59 52 96 6 6 71 13 3 16 8 61 82 40 13 4 36 32 57 12 23 54 3 60 79 5 55 61 46 96 40 38 17 30 17\n68 81 94 52 49 69 91 79 74 53 86 75 97 70 64 27 36 41 14 88 2 70 98 35 98 90 67 33 82 97 76 52 38 96 64 65 67 81 97 5\n65 92 76 44 28 98 62 59 96 70 25 66 31 89 59 13 55 75 3 15 4 75 82 99 81 57 38 44 39 9 59 46 1 65 72 34 96 14 75 75\n72 71 33 46 81 49 84 92 5 37 86 7 85 16 4 59 54 14 67 44 27 7 27 82 12 63 20 10 2 84 83 81 64 21 31 94 33 88 97 80\n64 91 77 91 82 3 7 54 69 67 0 89 84 7 15 73 11 41 52 56 61 28 84 91 5 77 16 44 15 99 1 23 62 50 94 91 85 59 51 73\n55 32 24 92 59 56 86 47 74 9 30 84 57 75 46 61 2 71 46 57 71 90 89 24 78 48 31 92 82 99 22 99 22 81 25 64 89 15 72 11\n51 69 30 30 14 27 10 25 83 22 49 52 19 29 44 84 62 92 26 84 74 13 95 28 40 46 16 14 50 40 41 95 68 3 69 44 44 91 10 60\n55 48 24 76 66 81 8 71 71 63 30 14 41 1 60 12 62 17 17 6 9 4 85 26 11 94 47 22 89 6 5 35 33 73 14 64 84 85 96 13\n44 2 40 92 39 62 12 99 49 52 28 3 61 56 84 89 98 31 74 86 25 72 56 68 18 1 28 87 3 52 17 82 41 22 68 45 98 3 41 73",
        expected: "2260",
      },
    ],
    hints: [
      "The robot reaches a cell either from above or from the left. Which one should it have come from?",
      "Whichever was cheaper to reach. best(r, c) = grid[r][c] + min(best(r - 1, c), best(r, c - 1)).",
      "The top row and left column have only one possible predecessor.",
      "Like counting routes, a single row array updated left to right is enough.",
    ],
    solutions: [
      {
        title: "Brute force: try every route",
        order: 1,
        intuition:
          "From any cell, the best route to the end is the cell's own delay plus the better of going down or going right. Recursing on that directly explores every route and recomputes shared tails many times.",
        approach: [
          "At the bottom-right cell, return its delay.",
          "Otherwise collect the options that stay on the grid: down and right.",
          "Return the cell's delay plus the smaller option.",
        ],
        code: {
          PYTHON: `def lightestRoute(grid: List[List[int]]) -> int:
    rows, cols = len(grid), len(grid[0])

    def best_from(r: int, c: int) -> int:
        if r == rows - 1 and c == cols - 1:
            return grid[r][c]
        options = []
        if r + 1 < rows:
            options.append(best_from(r + 1, c))
        if c + 1 < cols:
            options.append(best_from(r, c + 1))
        return grid[r][c] + min(options)

    return best_from(0, 0)`,
          JAVA: `class Solution {
    private int[][] grid;

    public int lightestRoute(int[][] grid) {
        this.grid = grid;
        return bestFrom(0, 0);
    }

    private int bestFrom(int r, int c) {
        int rows = grid.length, cols = grid[0].length;
        if (r == rows - 1 && c == cols - 1) return grid[r][c];
        int best = Integer.MAX_VALUE;
        if (r + 1 < rows) best = Math.min(best, bestFrom(r + 1, c));
        if (c + 1 < cols) best = Math.min(best, bestFrom(r, c + 1));
        return grid[r][c] + best;
    }
}`,
        },
        timeComplexity: "O(2^(rows + cols))",
        spaceComplexity: "O(rows + cols) recursion depth",
        edgeCases: ["A single cell, whose own delay is the answer."],
        commonMistakes: [
          "Treating an off-grid neighbour as delay 0, which makes leaving the floor look free.",
        ],
      },
      {
        title: "Optimal: one row of best delays",
        order: 2,
        intuition:
          "Filling cells in reading order means both possible predecessors are final before a cell is computed. Keeping one array per column, best[c] still holds the value from the row above until it is overwritten, while best[c - 1] already holds this row's value. That is exactly the pair the recurrence needs.",
        approach: [
          "Create best with one slot per column.",
          "For the start cell, best[0] is its delay.",
          "In the first row, a cell can only come from the left; in the first column, only from above.",
          "Everywhere else, best[c] = min(best[c], best[c - 1]) + grid[r][c].",
          "Return best[cols - 1].",
        ],
        code: {
          PYTHON: `def lightestRoute(grid: List[List[int]]) -> int:
    cols = len(grid[0])
    best = [0] * cols  # best[c] = lightest delay to reach column c of this row

    for r, row in enumerate(grid):
        for c in range(cols):
            if r == 0 and c == 0:
                best[c] = row[c]
            elif r == 0:
                best[c] = best[c - 1] + row[c]  # only from the left
            elif c == 0:
                best[c] = best[c] + row[c]  # only from above
            else:
                best[c] = min(best[c], best[c - 1]) + row[c]

    return best[cols - 1]`,
          JAVA: `class Solution {
    public int lightestRoute(int[][] grid) {
        int cols = grid[0].length;
        int[] best = new int[cols];

        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) {
                    best[c] = grid[r][c];
                } else if (r == 0) {
                    best[c] = best[c - 1] + grid[r][c];
                } else if (c == 0) {
                    best[c] = best[c] + grid[r][c];
                } else {
                    best[c] = Math.min(best[c], best[c - 1]) + grid[r][c];
                }
            }
        }

        return best[cols - 1];
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(cols)",
        edgeCases: [
          "A single row or a single column: only one route exists.",
          "All delays zero.",
          "A cheap corridor that winds right and down around expensive cells.",
        ],
        commonMistakes: [
          "Forgetting to add the starting cell's delay.",
          "Taking min over the top and left neighbours on the first row, where 'above' does not exist.",
          "Mutating the input grid in place, which surprises the caller.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(cols)",
  },

  {
    slug: "fewest-hops-to-exit",
    title: "Fewest Hops to the Exit",
    difficulty: "EASY",
    learningObjective:
      "Compute a shortest hop count with a table, then notice that the table fills in layers and can be replaced by a window sweep.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming", "greedy"],
    statement: [
      para(
        "A platform game level is a row of platforms. You start on platform 0 and the exit is the last platform. Each platform has a spring with a strength: from platform i you can hop forward to any platform at most reach[i] positions ahead. A spring of strength 0 cannot launch you anywhere."
      ),
      para(
        "Return the fewest hops needed to land on the exit, or -1 if the exit cannot be reached."
      ),
      example(
        "reach = [2, 3, 1, 1, 4]",
        "2",
        [
          { state: "0 hops: platforms 0..0", note: "the start" },
          { state: "1 hop: platforms 1..2", note: "platform 0 reaches up to 0 + 2" },
          {
            state: "2 hops: platforms 3..4",
            note: "platform 1 reaches up to 1 + 3, which includes the exit",
          },
        ],
        "Platforms reachable with each number of hops"
      ),
    ],
    constraints: ["1 ≤ reach.length ≤ 10000", "0 ≤ reach[i] ≤ 1000"],
    signature: {
      params: ["int[]"],
      paramNames: ["reach"],
      returns: "int",
      functionName: "fewestHops",
    },
    tests: [
      {
        input: "2 3 1 1 4",
        expected: "2",
        isSample: true,
        explanation:
          "Hop from platform 0 to 1, then use its strength of 3 to land on the exit.",
      },
      {
        input: "3 2 1 0 4",
        expected: "-1",
        isSample: true,
        explanation: "Every route lands on platform 3, whose spring has strength 0.",
      },
      {
        input: "0",
        expected: "0",
        isSample: true,
        explanation: "You start on the exit, so no hops are needed.",
      },
      { input: "1 1 1 1", expected: "3" },
      { input: "5 0 0 0 0 0", expected: "1" },
      { input: "1 0 1", expected: "-1" },
      { input: "2 0 0", expected: "1" },
      { input: "4 1 1 3 1 1 1", expected: "2" },
      {
        input:
          "4 4 3 3 6 3 5 6 5 1 2 1 3 5 1 3 3 1 6 5 2 4 2 1 6 6 5 5 4 2 2 6 1 1 2 4 2 1 1 3 6 1 3 2 6 2 1 6 1 2 4 5 6 6 3 2 1 4 5 3 5 2 4 6 2 3 1 1 4 4 3 4 1 5 1 6 4 5 1 4 5 3 4 5 5 3 3 6 4 1 1 5 3 5 4 5 5 4 1 2 6 3 4 1 2 5 4 2 2 5 5 4 1 1 5 1 1 1 4 1 4 3 3 1 4 3 2 2 5 1 3 3 1 6 6 5 3 5 6 6 3 1 3 5 5 5 1 1 1 3 6 6 2 5 1 1 4 4 2 3 2 3 1 3 4 5 5 3 1 5 2 4 1 4 2 6 4 6 2 5 2 3 3 3 6 1 2 2 3 6 1 2 6 6 6 3 4 5 1 6 1 5 3 4 3 4 1 2 6 6 1 3 2 2 2 4 3 4 6 5 4 6 6 4 1 6 1 5 2 3 3 6 5 3 3 4 6 1 3 2 2 2 2 5 2 1 3 1 5 2 1 6 1 6 2 3 3 2 2 2 5 1 6 1 6 6 2 5 5 3 4 4 3 1 1 5 1 5 2 4 5 6 3 5 2 3 6 6 4 4 1 4 3 5 3 3 6 5 2 6 3 2 4 1 3 6 1 3 2 1 3 4 4 5 5 1 1 2 6 5 6 3 3 4 4 3 6 5 5 3 3 3 3 2 1 5 2 3 2 1 3 5 4 3 6 5 6 4 4 5 5 5 3 3 1 5 6 4 5 6 2 5 1 2 6 2 4 3 1 5 1 6 5 2 1 1 1 4 2 3 2 3 1 5 1 5 2 6 4 6 4 2 4 6 4 1 4 2 6 3 5 5 1 3 6 3 3 1 5 5 1 2 6 6 3 6 3 3 1 6 5 3 6 6 1 3 2 3 2 3 6 2 1 2 1 2 3 2 6 2 3 2 4 6 2 2 5 2 6 3 5 1 6 5 4 4 2 4 3 4 6 3 3 6 2 3 6 4 2 1 6 2 6 2 6 3 1 5 6 4 3 4 6 2 4 5 3 1 3 1 6 2 3 4 6 5 5 3 2 2 1 5 3 5 1 6 2 3 1 6 3 2 2 3 1 3 4 1 3 4 6 5 2 2 1 2 5 5 3 5 3 6 1 3 5 4 1 2 2 5 2 5 1 1 5 1 1 4 6 1 4 5 5 2 5 5 1 1 1 1 1 4 6 6 1 4 3 3 1 5 6 2 6 3 5 2 6 6 6 6 6 2 3 5 3 3 6 1 4 1 2 4 2 3 4 6 4 3 5 3 2 1 1 5 2 3 4 2 5 4 5 1 1 3 5 1 2 1 6 1 4 1 6 6 6 4 3 4 4 2 5 3 1 3 1 5 3 1 2 2 6 2 5 2 4 5 4 1 5 1 2 5 1 6 2 6 6 4 5 4 3 1 5 5 1 3 3 1 3 6 4 5 5 3 4 4 4 2 6 2 4 4 1 4 6 6 1 2 5 5 6 2 5 4 4 6 2 1 6 6 6 3 6 5 4 3 6 6 6 5 3 5 5 2 2 4 4 2 4 3 6 6 3 2 5 6 5 4 4 6 1 5 6 3 6 2 6 1 3 4 6 4 3 6 2 1 6 3 6 6 1 3 2 6 1 6 2 5 1 2 2 1 3 4 5 3 4 3 6 3 6 6 1 1 3 4 2 6 4 4 6 4 1 4 6 2 4 3 5 3 6 5 3 5 6 1 6 3 1 1 5 2 4 4 1 2 1 5 6 1 4 3 6 2 2 1 5 2 4 4 3 5 4 1 6 6 4 4 1 2 2 3 1 2 1 1 3 5 4 6 4 5 2 6 3 3 1 6 6 3 1 1 4 5 1 4 3 5 6 1 4 6 1 6 5 3 5 4 6 2 3 4 5 3 1 1 6 1 3 1 1 6 5 5 3 1 5 4 1 1 3 3 3 3 6 4 6 3 6 4 1 1 4 1 1 4 4 5 2 6 2 5 1 1 3 2 5 4 3 3 5 1 5 6 2 2 1 4 6 5 2 2 3 2 6 5 5 1 6 1 3 5 3 4 2 6 6 4 2 6 5 1 6 6 3 2 4 2 2 4 4 6 1 6 3 4 4 6 4 2 3 3 4 3 5 2 4 1 5 6 1 4 1 6 3 6 1 4 1 5 4 3 3 1 3 4 6 1 5 1 3 2 3 5 4 2 4 3 2 5 6 3 3 4 3 1 1 2 3 5 5 6 5 3 5 4 2 2 2 5 6 5 4 3 6 3 4 5 4 2 1 2 5 3 1 5 6 2 1 2 4 5 5 6 6 5 4 6 3 4 2 3 2 6 5 5 4 3 2 1 5 3 4 2 2 5 1 2 1 1 4 5 2 5 3 3 6 2 5 4 3 5 3 6 3 5 5 3 2 6 5 2 3 6 6 3 5 5 3 3 3 4 1 4 2 3 5 4 4 5 3 6 1 2 6 6 5 1 5 4 4 4 4 6 5 3 3 4 2 5 3 3 4 6 2 4 4 4 4 3 3 2 1 2 4 5 1 5 3 1 6 3 1 1 4 6 2 6 6 5 1 2 1 1 4 3 2 3 5 3 4 1 6 3 4 2 1 6 4 1 4 5 3 6 2 5 4 4 2 1 3 4 4 3 6 5 5 3 4 4 4 1 3 5 5 1 2 2 3 2 2 2 3 6 3 1 4 5 6 2 2 5 5 5 2 6 6 5 6 4 1 4 2 3 2 4 4 4 1 4 1 1 6 6 1 4 4 2 1 2 3 1 3 4 6 5 6 6 3 6 3 1 6 5 4 2 5 1 5 2 3 3 4 2 1 5 1 1 5 3 1 1 2 4 3 4 2 5 6 4 4 1 2 3 4 4 3 6 2 1 4 6 1 1 3 2 6 3 2 1 1 2 3 5 1 5 1 5 3 6 6 4 2 1 5 1 5 4 1 5 4 4 4 4 5 4 4 2 5 2 6 4 1 6 1 4 2 4 4 2 6 4 4 2 1 4 5 4 2 5 4 5 3 4 3 2 1 5 4 5 1 1 2 2 3 1 6 5 3 3 1 6 3 1 1 4 6 6 4 4 5 1 6 4 6 2 6 6 6 1 6 5 4 2 4 3 4 4 3 5 3 6 3 3 4 2 3 4 4 2 4 6 5 4 1 6 5 4 3 4 6 3 6 4 6 1 5 6 5 5 1 4 3 6 4 5 2 1 5 1 5 4 5 1 5 3 1 3 5 3 6 5 1 1 2 3 6 3 2 5 3 6 1 1 1 6 1 4 6 1 3 5 4 1 5 4 2 6 2 6 1 2 3 3 4 5 4 2 5 2 3 1 1 5 5 2 5 4 2 6 1 5 2 4 4 4 2 1 2 4 2 5 3 3 5 2 6 2 2 2 2 4 3 4 5 6 4 1 1 5 2 2 3 6 5 2 4 4 6 2 5 3 4 5 1 5 6 2 4 2 5 3 6 5 6 4 1 6 6 5 1 6 1 3 5 1 6 3 3 3 4 4 6 2 3 2 1 5 2 5 3 6 1 4 3 3 5 2 6 3 1 5 1 4 6 1 1 2 3 4 6 2 2 3 6 3 4 1 4 3 1 6 6 1 6 3 2 4 3 1 2 3 3 2 1 1 2 3 4 1 3 2 6 5 1 1 6 3 3 3 6 3 2 5 3 3 3 4 2 6 2 2 2 4 2 6 6 1 6 5 6 5 3 4 1 2 4 1 3 2 6 5 1 2 2 2 1 1 4 5 2 5 1 2 3 5 4 1 4 4 1 2 3 1 4 4 5 2 3 4 6 2 2 3 3 5 2 6 6 2 6 2 5 4 5 2 1 1 4 5 1 3 2 2 4 1 4 3 3 6 2 5 6 1 3 5 6 1 2 2 5 5 5 5 5 6 5 5 2 4 1 5 4 4 3 3 1 5 5 3 4 6 1 4 1 4 2 4 5 6 5 1 4 4 3 1 3 3 3 6 4 2 4 2 5 6 2 4 1 6 2 1 1 1 5 5 1 4 4 5 1 5 3 4 2 5 6 6 6 3 2 4 4 6 2 1 6 2 3 6 6 3 2 6 1 1 6 4 3 1 4 2 2 4 2 4 3 6 6 2 6 4 6 3 6 5 6 3 6 6 5 2 5 6 5 3 1 5 5 5 3 4 1 2 4 4 4 2 5 3 5 5 2 6 6 1 6 6 4 2 2 4 4 5 1 2 6 3 6 3 2 1 4 3 5 3 6 6 4 6 4 1 1 5 3 1 6 4 4 6 2 1 4 5 4 1 2 6 4 2 4 5 3 3 2 3 5 4 4 5 2 3 5 6 4 6 6 2 5 1 1 2 6 5 4 1 3 6 5 6 2 1 6 4 2 6 4 4 3 1 1 4 2 5 5 1 1 6 4 5 5 4 3 5 2 3 5 1 4 5",
        expected: "468",
      },
      {
        input:
          "1 2 1 2 1 1 4 2 1 3 4 1 2 3 1 4 1 2 3 4 4 4 3 4 2 1 2 3 2 4 2 1 1 2 2 1 4 2 2 1 2 2 2 1 4 2 2 4 2 3 2 1 3 4 2 3 4 2 2 3 1 3 1 1 3 4 3 1 4 3 3 1 4 3 3 4 1 2 3 4 4 1 3 2 3 1 2 1 2 1 1 4 4 1 1 1 4 1 3 3 2 4 2 2 3 3 4 4 4 4 3 3 2 3 3 4 3 2 2 4 3 1 3 1 2 2 1 1 3 1 4 4 1 2 4 2 1 2 4 1 1 1 3 3 3 2 2 2 3 3 4 1 1 4 1 1 3 1 1 2 1 3 3 3 1 1 2 4 2 1 2 4 1 2 3 3 4 2 4 1 1 4 2 3 3 3 4 1 4 1 1 3 3 2 4 3 3 4 3 3 4 1 2 2 2 1 1 2 1 3 2 4 1 3 1 3 3 2 3 3 1 1 2 3 1 1 3 4 3 1 3 1 2 1 4 3 4 3 2 1 2 3 1 1 1 1 4 3 3 3 2 1 1 3 1 1 2 1 3 2 2 1 2 2 3 2 4 4 3 2 4 4 3 1 4 4 2 2 3 1 2 4 3 3 2 2 3 1 4 1 3 1 1 2 3 1 1 3 4 1 1 2 1 1 4 1 3 2 1 2 1 3 3 1 3 4 3 2 4 4 4 1 4 1 2 1 3 1 3 4 3 2 1 4 1 1 1 1 4 4 2 3 4 1 2 4 2 1 4 1 1 1 2 2 2 3 3 3 3 2 1 1 1 3 3 1 4 2 2 2 2 3 2 1 3 4 1 4 2 2 3 1 1 2 1 2 3 2 3 2 2 4 1 4 2 4 1 2 1 2 3 2 2 2 2 3 1 1 4 2 3 3 1 1 2 2 4 3 3 3 4 2 3 2 4 4 4 3 4 2 4 1 2 4 2 2 2 2 2 2 1 2 4 4 1 1 1 4 4 2 2 3 3 1 1 2 4 3 2 4 3 2 4 3 4 2 3 2 4 4 4 1 3 3 3 4 2 3 3 3 1 4 1 3 3 4 3 3 2 2 2 1 2 4 3 1 2 4 2 2 2 3 1 3 3 2 3 3 2 1 2 4 1 1 1 2 2 3 3 1 2 3 4 4 3 2 2 4 3 1 1 4 2 2 1 4 1 3 1 1 2 4 1 1 2 2 3 2 2 2 2 4 1 3 2 1 2 1 1 1 1 1 3 1 1 2 2 4 4 2 2 2 4 3 1 4 1 4 2 4 1 4 2 2 3 4 1 2 2 4 4 2 3 2 1 4 3 4 1 4 3 1 2 4 2 4 4 1 2 2 4 3 3 3 4 1 1 3 4 2 4 4 2 4 1 4 2 3 1 4 1 4 3 1 4 1 2 2 2 3 1 2 3 1 1 1 4 3 2 2 2 4 3 3 2 4 4 2 1 3 3 1 4 2 2 4 4 4 1 1 3 1 4 2 2 2 3 1 3 1 2 2 4 1 3 1 2 2 3 1 3 4 1 4 1 4 4 2 3 1 2 3 4 1 2 1 4 1 2 3 1 4 3 2 1 3 1 4 4 1 4 1 3 2 2 4 3 4 2 3 4 2 2 4 2 1 2 1 1 4 2 4 2 3 2 4 2 4 3 3 3 4 2 1 4 4 1 3 2 1 3 3 2 1 4 3 2 3 1 3 1 4 2 3 2 2 4 3 2 2 3 4 1 4 2 3 3 3 1 2 2 1 3 1 1 3 3 4 1 1 1 4 2 4 4 2 4 4 2 2 3 4 3 2 2 1 4 3 4 4 2 3 4 1 4 3 3 1 2 1 4 4 3 2 2 3 3 3 2 4 1 3 1 4 4 2 2 1 3 1 3 4 3 1 1 3 3 1 4 2 3 3 4 2 4 3 2 3 1 1 2 3 3 4 2 2 2 2 3 1 2 1 1 3 4 4 1 2 2 3 2 2 2 3 2 1 4 2 3 1 2 1 2 1 1 3 4 1 3 2 1 1 4 2 4 2 2 3 2 2 2 4 1 2 2 2 2 4 4 3 4 2 4 4 3 2 4 3 2 2 2 3 2 3 2 4 1 1 1 1 1 1 4 4 2 3 4 3 1 1 2 2 4 3 1 2 4 2 3 3 1 4 1 2 3 4 2 4 1 3 3 4 4 3 4 3 1 4 3 2 2 3 2 2 2 1 1 1 3 2 0 0 0 0 0 0 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5",
        expected: "-1",
      },
    ],
    hints: [
      "Let hops[j] be the fewest hops to land on platform j. Which platforms can lead to j?",
      "Filling hops[] forwards, each platform i relaxes every j in i + 1 .. i + reach[i]. That works, but it is O(n × reach).",
      "Group platforms by their hop count. The platforms reachable in exactly k hops always form one contiguous block.",
      "Sweep the current block, track the farthest platform any of them can reach, and that becomes the end of the next block.",
    ],
    solutions: [
      {
        title: "Table of fewest hops",
        order: 1,
        intuition:
          "The fewest hops to platform j is one more than the fewest hops to any platform that can reach j. Processing platforms left to right, each finished platform pushes its count + 1 to every platform within its reach. Correct and straightforward, but a strong spring touches many platforms.",
        approach: [
          "Set hops[0] = 0 and every other entry to 'unreached'.",
          "For each reached platform i, for every j from i + 1 to i + reach[i] (within the level), set hops[j] to min(hops[j], hops[i] + 1).",
          "Return hops[last], or -1 if it was never reached.",
        ],
        code: {
          PYTHON: `def fewestHops(reach: List[int]) -> int:
    n = len(reach)
    unreached = n + 1
    hops = [unreached] * n
    hops[0] = 0

    for i in range(n):
        if hops[i] == unreached:
            continue
        for j in range(i + 1, min(n, i + reach[i] + 1)):
            hops[j] = min(hops[j], hops[i] + 1)

    return -1 if hops[n - 1] == unreached else hops[n - 1]`,
          JAVA: `class Solution {
    public int fewestHops(int[] reach) {
        int n = reach.length;
        int unreached = n + 1;
        int[] hops = new int[n];
        java.util.Arrays.fill(hops, unreached);
        hops[0] = 0;

        for (int i = 0; i < n; i++) {
            if (hops[i] == unreached) continue;
            int last = Math.min(n - 1, i + reach[i]);
            for (int j = i + 1; j <= last; j++) {
                hops[j] = Math.min(hops[j], hops[i] + 1);
            }
        }

        return hops[n - 1] == unreached ? -1 : hops[n - 1];
    }
}`,
        },
        timeComplexity: "O(n × max reach)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A one-platform level, which needs 0 hops.",
          "A zero-strength spring before the exit.",
        ],
        commonMistakes: [
          "Relaxing from platforms that were never reached, which invents routes.",
        ],
      },
      {
        title: "Optimal: sweep the hop layers",
        order: 2,
        intuition:
          "If platform j is reachable in k hops, so is every platform between the start of that layer and j, because a spring can stop short. So each hop count covers one contiguous window of platforms. Scanning the current window and tracking the farthest landing spot gives the next window's end. The number of windows crossed before the exit is inside one is the answer; a window that cannot grow means the exit is cut off.",
        approach: [
          "If there is only one platform, return 0.",
          "Keep windowEnd (the farthest platform reachable with the current hop count), farthest, and a scan index i.",
          "While windowEnd is before the exit: scan i up to windowEnd, updating farthest with i + reach[i].",
          "If farthest did not move past windowEnd, return -1.",
          "Otherwise count one hop and set windowEnd = farthest.",
        ],
        code: {
          PYTHON: `def fewestHops(reach: List[int]) -> int:
    n = len(reach)
    hops = 0
    window_end = 0  # farthest platform reachable using \`hops\` hops
    farthest = 0    # farthest platform reachable using one more hop
    i = 0

    while window_end < n - 1:
        while i <= window_end:
            farthest = max(farthest, i + reach[i])
            i += 1
        if farthest <= window_end:
            return -1  # the next layer is empty: stuck
        hops += 1
        window_end = farthest

    return hops`,
          JAVA: `class Solution {
    public int fewestHops(int[] reach) {
        int n = reach.length;
        int hops = 0, windowEnd = 0, farthest = 0, i = 0;

        while (windowEnd < n - 1) {
            while (i <= windowEnd) {
                farthest = Math.max(farthest, i + reach[i]);
                i++;
            }
            if (farthest <= windowEnd) return -1;
            hops++;
            windowEnd = farthest;
        }

        return hops;
    }
}`,
        },
        timeComplexity: "O(n) — every platform is scanned once",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A single platform: the loop never runs and the answer is 0.",
          "A wall of zero-strength platforms that no spring can clear: -1.",
          "A first spring strong enough to reach the exit directly: 1.",
        ],
        commonMistakes: [
          "Counting a hop for every platform scanned instead of once per layer.",
          "Not detecting a layer that fails to grow, which loops forever.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "fewest-tokens-for-fare",
    title: "Fewest Tokens for the Fare",
    difficulty: "EASY",
    learningObjective:
      "Build an answer for every amount from 0 up to the target, each from smaller amounts already solved, and see why greedy fails.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "An old ferry turnstile only accepts metal tokens. Tokens come in a few denominations and you have an unlimited supply of each. The turnstile gives no change, so you must insert exactly the fare."
      ),
      rich(
        "Given the token denominations and the fare, return the fewest tokens that add up to the fare exactly, or ",
        { code: "-1" },
        " if no combination works."
      ),
      example(
        "tokens = [1, 4, 5], fare = 8",
        "2",
        [
          {
            state: "greedy: 5 + 1 + 1 + 1",
            note: "4 tokens — taking the biggest first is not optimal",
          },
          { state: "best[4] = 1, best[5] = 1", note: "one token each" },
          {
            state: "best[8] = min(best[7], best[4], best[3]) + 1",
            note: "last token 1, 4 or 5",
          },
          { state: "best[8] = best[4] + 1 = 2", note: "4 + 4" },
        ],
        "Building up from smaller fares"
      ),
    ],
    constraints: [
      "1 ≤ tokens.length ≤ 12",
      "1 ≤ tokens[i] ≤ 1000, all distinct",
      "0 ≤ fare ≤ 10000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["tokens", "fare"],
      returns: "int",
      functionName: "fewestTokens",
    },
    tests: [
      {
        input: "1 4 5\n8",
        expected: "2",
        isSample: true,
        explanation:
          "Two 4-tokens. Taking the 5 first forces 5 + 1 + 1 + 1, four tokens.",
      },
      {
        input: "2\n3",
        expected: "-1",
        isSample: true,
        explanation: "Only even fares can be paid with 2-tokens.",
      },
      {
        input: "3 7\n0",
        expected: "0",
        isSample: true,
        explanation: "A fare of 0 needs no tokens.",
      },
      { input: "1\n1", expected: "1" },
      { input: "5 10\n3", expected: "-1" },
      { input: "2 5 10 1\n27", expected: "4" },
      { input: "186 419 83 408\n6249", expected: "20" },
      { input: "9 6 5 1\n11", expected: "2" },
      { input: "7 13 29 101\n10000", expected: "104" },
      { input: "4 6\n9999", expected: "-1" },
    ],
    hints: [
      "Always grabbing the largest token that fits sounds sensible. Try it on tokens [1, 4, 5] and fare 8.",
      "Think about the last token inserted. If it was worth t, the rest is the best answer for fare - t.",
      "best(a) = 1 + min over tokens t ≤ a of best(a - t), with best(0) = 0.",
      "Fill best[] for every amount from 1 up to the fare, marking amounts that cannot be made.",
    ],
    solutions: [
      {
        title: "Brute force: try every last token",
        order: 1,
        intuition:
          "Any exact payment ends with some token. Try each one, solve the smaller fare recursively, and keep the fewest. It is correct but the same smaller fares are solved again along every path that leads to them.",
        approach: [
          "If the remaining fare is 0, no tokens are needed.",
          "For each token not larger than the remaining fare, recurse on the remainder.",
          "Keep the smallest result plus one; if nothing worked, the fare is impossible.",
        ],
        code: {
          PYTHON: `def fewestTokens(tokens: List[int], fare: int) -> int:
    impossible = fare + 1  # more tokens than any real answer could use

    def fewest(remaining: int) -> int:
        if remaining == 0:
            return 0
        best = impossible
        for t in tokens:
            if t <= remaining:
                best = min(best, fewest(remaining - t) + 1)
        return best

    answer = fewest(fare)
    return -1 if answer >= impossible else answer`,
          JAVA: `class Solution {
    private int[] tokens;
    private int impossible;

    public int fewestTokens(int[] tokens, int fare) {
        this.tokens = tokens;
        this.impossible = fare + 1;
        int answer = fewest(fare);
        return answer >= impossible ? -1 : answer;
    }

    private int fewest(int remaining) {
        if (remaining == 0) return 0;
        int best = impossible;
        for (int t : tokens) {
            if (t <= remaining) best = Math.min(best, fewest(remaining - t) + 1);
        }
        return best;
    }
}`,
        },
        timeComplexity: "O(k^(fare / smallest token)) — exponential",
        spaceComplexity: "O(fare) recursion depth",
        edgeCases: ["A fare of 0, which needs no tokens."],
        commonMistakes: [
          "Using greedy (largest token first), which gives 4 tokens instead of 2 for fare 8 with [1, 4, 5].",
          "Using a huge sentinel like Integer.MAX_VALUE and then adding 1 to it.",
        ],
      },
      {
        title: "Optimal: table over every amount",
        order: 2,
        intuition:
          "There are only fare + 1 distinct questions: the best answer for each amount from 0 to the fare. Answer them smallest first, and every lookup best[a - t] is already final. A value of fare + 1 works as 'impossible', since no real answer can use more tokens than the fare (the smallest token is at least 1).",
        approach: [
          "Create best of length fare + 1, with best[0] = 0 and everything else fare + 1.",
          "For each amount a from 1 to fare, and each token t ≤ a, set best[a] = min(best[a], best[a - t] + 1).",
          "Return best[fare], or -1 if it is still fare + 1.",
        ],
        code: {
          PYTHON: `def fewestTokens(tokens: List[int], fare: int) -> int:
    impossible = fare + 1
    best = [impossible] * (fare + 1)
    best[0] = 0

    for amount in range(1, fare + 1):
        for t in tokens:
            # The last token is t; the rest is an amount already solved.
            if t <= amount and best[amount - t] + 1 < best[amount]:
                best[amount] = best[amount - t] + 1

    return -1 if best[fare] == impossible else best[fare]`,
          JAVA: `class Solution {
    public int fewestTokens(int[] tokens, int fare) {
        int impossible = fare + 1;
        int[] best = new int[fare + 1];
        java.util.Arrays.fill(best, impossible);
        best[0] = 0;

        for (int amount = 1; amount <= fare; amount++) {
            for (int t : tokens) {
                if (t <= amount && best[amount - t] + 1 < best[amount]) {
                    best[amount] = best[amount - t] + 1;
                }
            }
        }

        return best[fare] == impossible ? -1 : best[fare];
    }
}`,
        },
        timeComplexity: "O(fare × k)",
        spaceComplexity: "O(fare)",
        edgeCases: [
          "fare = 0 returns 0.",
          "No combination reaches the fare (for example, only even tokens and an odd fare).",
          "A single denomination of 1, where the answer is the fare itself.",
        ],
        commonMistakes: [
          "Returning best[fare] directly without converting the sentinel to -1.",
          "Adding 1 to an impossible entry and letting it win: compare against the sentinel, not just any smaller number.",
        ],
      },
    ],
    expectedTime: "O(fare × k)",
    expectedSpace: "O(fare)",
  },

  {
    slug: "longest-shared-subsequence",
    title: "What Survived Both Edits",
    difficulty: "EASY",
    learningObjective:
      "Define a two-index subproblem over two strings and fill its table, matching characters on the diagonal.",
    topics: ["dynamic-programming", "strings"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "Two editors each took the same draft and deleted some characters from it, without adding or reordering anything. You only have their two results. A good estimate of how much of the draft survived both edits is the longest sequence of characters that appears, in order, in both results."
      ),
      para(
        "Return the length of the longest string that is a subsequence of both first and second. A subsequence keeps characters in their original order but may skip any of them."
      ),
      example(
        'first = "sunrise", second = "surprise"',
        "6",
        [
          { state: "s = s, u = u", note: "match both: length 2" },
          { state: "n has no partner", note: "skip it in first" },
          { state: "r = r", note: "length 3; skip p and the second r in second" },
          { state: "i, s, e match in order", note: 'length 6: "surise"' },
        ],
        "One longest shared subsequence"
      ),
    ],
    constraints: [
      "0 ≤ first.length, second.length ≤ 1000",
      "Both strings contain lowercase English letters only.",
    ],
    signature: {
      params: ["string", "string"],
      paramNames: ["first", "second"],
      returns: "int",
      functionName: "longestSharedSubsequence",
    },
    tests: [
      {
        input: "sunrise\nsurprise",
        expected: "6",
        isSample: true,
        explanation: '"surise" appears in order in both words.',
      },
      {
        input: "abc\nxyz",
        expected: "0",
        isSample: true,
        explanation: "The two drafts share no characters.",
      },
      { input: "\nabc", expected: "0" },
      { input: "same\nsame", expected: "4" },
      { input: "a\na", expected: "1" },
      { input: "aaaa\naa", expected: "2" },
      { input: "abcde\nace", expected: "3" },
      { input: "bsbininm\njmjkbkjkv", expected: "1" },
      {
        input:
          "tggttattattcatccgaacgctgcaaatgcaaacggaccggttctgcccacagtcctggccaacacatgcgcatgaggttatagcattacgggcctatccacggcgcccagggtagtgcggtcattgccagtaaacggcaccctttttcaatcataaattcccagcagacttgttaaaatgccgttgcttcaattgaagaaaaaggacttcgacgtaatggaatgacgttcccagtaacaaagataaatatagcataatgttctatagagcggaaacctgcaccgcgttgcccctcgtcatgccgcacgcgtaccctcggaagctcgtgatgtattaagattttcgcaaagggtaacaggtcccagtacactataggcacgccgcctgtgccagctataacaaatacgtaatggcaacgggatcgaactcgcgatactaccataaccaagaccatcacccagccagggaatgtccctagctgtcgcctggggtcatactagacaacgcatgcttcctccatcgccaccatgtccgatcttgaatcaaggaaggctaggatagtgcaggtaagccgcggctggtttacacacttatcaactccattgctgcttctatgcttttctcatgtaaagcaggtcgacgggacactagtaggtacccgggggattcggccagctaacttcccacggctgctcgctacactagccaccagttccacagctcccctagacccctggctataacgtactctatgtcgctccagtacatgctgggtctgtgcagcacggacgccatatc\ntctggttccggcgccggcggctcaacgcggctcgagactcatcaccttttctccatatagcgcggacgctagacttcgtatgggtggcaggtaagctaggaagtcggagatcgggcataatggcgacgagggcctacgcggaagtacctgacccgcgagcccggaggcgcaggcaatgacggcagctagcaaagtgcggtctccgtgccgctgtctcccttatttcaatctctggcgcttctggctcttaggggttctgaaccaaggccgtgggcgtttgatacataaccccaaaagagctgataatgaatactgcgtgtagctgtcgttgtgtcgggcagcgaagcacggtacttacctgactgagtgactcaagtagcgcgcctcgggcattctagataattgcgttaagtaaggtaaatatgatgaacattcgatcacacgtgtaacctgggattcaaaacttcacgatgtagcctttgtgcgtgggtggcctttatacattttcgtagtctagctgtaaagatgatttcacaatcggccatcaggccatttgctctgtcttcgcggtaaggtcaagtagtctcttcatacaagtcgatctgcaccctagccctcgtaggcttttgtacatcgcaaggctcaccactcccgtgatatatcgccagtctgagaatttttgatgtatactctcagattccagattagttagtccaaggccaacctgccgggttaatgggggacgaacagattcatgccactagcttgtatttcctaatctctgctgtgcgcgttaagcc",
        expected: "511",
      },
    ],
    hints: [
      "Compare the first character of each string. What can you conclude if they are equal?",
      "If they are equal, use both and continue on the rest of each string. If not, at least one of them is not used; try dropping either.",
      "The subproblem is a pair of prefixes: L(i, j) = longest shared subsequence of first[:i] and second[:j].",
      "Each row of that table depends only on the previous row. Fill it row by row.",
    ],
    solutions: [
      {
        title: "Brute force: drop one character or match both",
        order: 1,
        intuition:
          "Looking at the front characters, a match can always be used (it never hurts), and a mismatch means one of the two characters is not part of the answer. Branching on which one gives a correct recursion, but the same pair of suffixes is reached through many different branch orders.",
        approach: [
          "Recurse on positions i and j.",
          "If either string is exhausted, return 0.",
          "If first[i] == second[j], return 1 + solve(i + 1, j + 1).",
          "Otherwise return max(solve(i + 1, j), solve(i, j + 1)).",
        ],
        code: {
          PYTHON: `def longestSharedSubsequence(first: str, second: str) -> int:
    def solve(i: int, j: int) -> int:
        if i == len(first) or j == len(second):
            return 0
        if first[i] == second[j]:
            return 1 + solve(i + 1, j + 1)
        return max(solve(i + 1, j), solve(i, j + 1))

    return solve(0, 0)`,
          JAVA: `class Solution {
    private String first, second;

    public int longestSharedSubsequence(String first, String second) {
        this.first = first;
        this.second = second;
        return solve(0, 0);
    }

    private int solve(int i, int j) {
        if (i == first.length() || j == second.length()) return 0;
        if (first.charAt(i) == second.charAt(j)) return 1 + solve(i + 1, j + 1);
        return Math.max(solve(i + 1, j), solve(i, j + 1));
    }
}`,
        },
        timeComplexity: "O(2^(m + n)) in the worst case",
        spaceComplexity: "O(m + n) recursion depth",
        edgeCases: ["An empty string on either side gives 0."],
        commonMistakes: [
          "Advancing only one index on a match, which can count the same character twice.",
        ],
      },
      {
        title: "Optimal: prefix table, two rows at a time",
        order: 2,
        intuition:
          "There are only (m + 1) × (n + 1) distinct pairs of prefixes. Filling them in order, the cell for (i, j) needs the cell diagonally up-left on a match, or the better of the cells above and to the left otherwise. Since only the previous row is consulted, keep two rows.",
        approach: [
          "prev holds row i - 1 of the table (initially all zeros: the empty prefix of first).",
          "For each character of first, build cur from left to right.",
          "On a match, cur[j] = prev[j - 1] + 1; otherwise cur[j] = max(prev[j], cur[j - 1]).",
          "Swap in cur as prev. After all rows, prev[n] is the answer.",
        ],
        code: {
          PYTHON: `def longestSharedSubsequence(first: str, second: str) -> int:
    n = len(second)
    # prev[j] = answer for the prefixes processed so far and second[:j]
    prev = [0] * (n + 1)

    for ch in first:
        cur = [0] * (n + 1)
        for j in range(1, n + 1):
            if ch == second[j - 1]:
                cur[j] = prev[j - 1] + 1  # use this matching pair
            else:
                cur[j] = max(prev[j], cur[j - 1])  # drop one character
        prev = cur

    return prev[n]`,
          JAVA: `class Solution {
    public int longestSharedSubsequence(String first, String second) {
        int n = second.length();
        int[] prev = new int[n + 1];

        for (int i = 0; i < first.length(); i++) {
            char ch = first.charAt(i);
            int[] cur = new int[n + 1];
            for (int j = 1; j <= n; j++) {
                if (ch == second.charAt(j - 1)) {
                    cur[j] = prev[j - 1] + 1;
                } else {
                    cur[j] = Math.max(prev[j], cur[j - 1]);
                }
            }
            prev = cur;
        }

        return prev[n];
    }
}`,
        },
        timeComplexity: "O(m × n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Either string empty: the loops do nothing useful and the answer is 0.",
          "Identical strings: the answer is the full length.",
          "No letters in common.",
        ],
        commonMistakes: [
          "Confusing subsequence with substring: the characters need not be adjacent.",
          "Updating a single row in place without saving the diagonal value first.",
        ],
      },
    ],
    expectedTime: "O(m × n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "count-change-combinations",
    title: "Ways to Pay a Refund",
    difficulty: "MEDIUM",
    learningObjective:
      "Count combinations rather than orderings by fixing the order in which coin types are introduced.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A self-service kiosk pays refunds in coins and has an unlimited stock of each coin type it holds. The operators want to know how much flexibility the kiosk has for a given refund."
      ),
      para(
        "Given the refund amount and the coin values, return the number of different collections of coins that add up to the amount. Collections are unordered: 2 + 1 and 1 + 2 are the same collection. Paying 0 has exactly one collection, the empty one."
      ),
      example(
        "amount = 5, coins = [1, 2, 5]",
        "4",
        [
          {
            state: "start: ways = [1, 0, 0, 0, 0, 0]",
            note: "only 0 is payable with no coins",
          },
          { state: "with 1s: [1, 1, 1, 1, 1, 1]", note: "one way for every amount" },
          { state: "with 2s: [1, 1, 2, 2, 3, 3]", note: "ways[a] += ways[a - 2]" },
          { state: "with 5s: [1, 1, 2, 2, 3, 4]", note: "ways[5] += ways[0]" },
        ],
        "Introducing one coin type at a time"
      ),
    ],
    constraints: [
      "0 ≤ amount ≤ 5000",
      "1 ≤ coins.length ≤ 50",
      "1 ≤ coins[i] ≤ 5000, all distinct",
      "The answer fits in a 32-bit signed integer.",
    ],
    signature: {
      params: ["int", "int[]"],
      paramNames: ["amount", "coins"],
      returns: "int",
      functionName: "countPayouts",
    },
    tests: [
      {
        input: "5\n1 2 5",
        expected: "4",
        isSample: true,
        explanation: "5; 2 + 2 + 1; 2 + 1 + 1 + 1; 1 + 1 + 1 + 1 + 1.",
      },
      {
        input: "3\n2",
        expected: "0",
        isSample: true,
        explanation: "Only even amounts can be paid in 2-coins.",
      },
      {
        input: "0\n4 9",
        expected: "1",
        isSample: true,
        explanation: "The empty collection is the one way to pay nothing.",
      },
      { input: "10\n10", expected: "1" },
      { input: "7\n3 5", expected: "0" },
      { input: "12\n1 2 3", expected: "19" },
      { input: "100\n1 5 10 25 50", expected: "292" },
      { input: "1000\n3 7 11 19 23", expected: "467039" },
      { input: "5000\n11 24 37 53 101 233", expected: "2669574" },
    ],
    hints: [
      "If you count 'which coin goes last', you will count 1 + 2 and 2 + 1 separately. How do you stop that?",
      "Decide coin types in a fixed order: how many of the first type, then how many of the second, and so on.",
      "Let ways[a] be the number of collections for amount a using the coin types introduced so far.",
      "Introduce one coin type at a time and sweep amounts upward: ways[a] += ways[a - coin]. The loop order is the whole trick.",
    ],
    solutions: [
      {
        title: "Brute force: use this coin again, or move past it",
        order: 1,
        intuition:
          "Walk through the coin types in order. At each step either use the current coin once more (staying on it) or never use it again (moving to the next type). Because types are only ever visited in one order, each collection is generated exactly once. The recursion is correct but revisits the same (type, remaining) pairs many times.",
        approach: [
          "Recurse with an index into coins and the amount still to pay.",
          "Remaining 0: one collection found. Out of coins or overpaid: 0.",
          "Return the count using coins[i] again plus the count skipping to coins[i + 1].",
        ],
        code: {
          PYTHON: `def countPayouts(amount: int, coins: List[int]) -> int:
    def count(i: int, remaining: int) -> int:
        if remaining == 0:
            return 1
        if i == len(coins) or remaining < 0:
            return 0
        use_again = count(i, remaining - coins[i])
        move_on = count(i + 1, remaining)
        return use_again + move_on

    return count(0, amount)`,
          JAVA: `class Solution {
    private int[] coins;

    public int countPayouts(int amount, int[] coins) {
        this.coins = coins;
        return count(0, amount);
    }

    private int count(int i, int remaining) {
        if (remaining == 0) return 1;
        if (i == coins.length || remaining < 0) return 0;
        return count(i, remaining - coins[i]) + count(i + 1, remaining);
    }
}`,
        },
        timeComplexity: "Exponential in amount / smallest coin",
        spaceComplexity: "O(amount) recursion depth",
        edgeCases: ["amount = 0, which counts the empty collection."],
        commonMistakes: [
          "Branching on 'any coin next' instead of 'this coin or move on', which counts orderings.",
        ],
      },
      {
        title: "Optimal: one table, coin types on the outside",
        order: 2,
        intuition:
          "Processing coin types in the outer loop means that when coin c is being added, ways[] describes collections made of earlier types plus any number of c's. Sweeping amounts upward lets ways[a - c] already include c's used this round, which is what permits using c repeatedly. Because a later type can never be followed by an earlier one, no ordering is counted twice.",
        approach: [
          "Create ways of length amount + 1 with ways[0] = 1.",
          "For each coin, for a from coin up to amount: ways[a] += ways[a - coin].",
          "Return ways[amount].",
        ],
        code: {
          PYTHON: `def countPayouts(amount: int, coins: List[int]) -> int:
    # ways[a] = collections paying a with the coin types seen so far
    ways = [0] * (amount + 1)
    ways[0] = 1

    for coin in coins:  # coin types on the OUTSIDE: no orderings
        for a in range(coin, amount + 1):  # upward: this coin may repeat
            ways[a] += ways[a - coin]

    return ways[amount]`,
          JAVA: `class Solution {
    public int countPayouts(int amount, int[] coins) {
        int[] ways = new int[amount + 1];
        ways[0] = 1;

        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                ways[a] += ways[a - coin];
            }
        }

        return ways[amount];
    }
}`,
        },
        timeComplexity: "O(amount × k)",
        spaceComplexity: "O(amount)",
        edgeCases: [
          "amount = 0 returns 1.",
          "No collection works, for example only 2-coins and an odd amount: 0.",
          "A coin larger than the amount simply contributes nothing.",
        ],
        commonMistakes: [
          "Swapping the loops (amounts outside, coins inside), which counts every ordering separately.",
          "Sweeping amounts downward, which lets each coin be used at most once.",
        ],
      },
    ],
    expectedTime: "O(amount × k)",
    expectedSpace: "O(amount)",
  },

  {
    slug: "longest-rising-sequence",
    title: "Longest Rising Streak of Readings",
    difficulty: "MEDIUM",
    learningObjective:
      "Solve longest increasing subsequence with an O(n²) table, then speed it up by keeping the smallest tail for each length and binary searching it.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming", "binary-search"],
    statement: [
      para(
        "A fitness tracker records a training score after every session. A coach wants the longest run of sessions, not necessarily consecutive, in which every chosen score is strictly higher than the one chosen before it."
      ),
      para(
        "Given the scores in session order, return the length of the longest strictly increasing subsequence. Equal scores do not count as rising."
      ),
      example(
        "readings = [5, 2, 8, 6, 3, 6, 9, 7]",
        "4",
        [
          { state: "5 → tails [5]", note: "best ending for length 1" },
          { state: "2 → tails [2]", note: "2 is a lower start than 5" },
          { state: "8 → tails [2, 8]", note: "extends the longest" },
          { state: "6 → [2, 6], 3 → [2, 3]", note: "lower tails for length 2" },
          { state: "6 → [2, 3, 6], 9 → [2, 3, 6, 9]", note: "length 4" },
          { state: "7 → [2, 3, 6, 7]", note: "length stays 4: 2, 3, 6, 7" },
        ],
        "Smallest tail for each length"
      ),
    ],
    constraints: ["0 ≤ readings.length ≤ 10000", "-10000 ≤ readings[i] ≤ 10000"],
    signature: {
      params: ["int[]"],
      paramNames: ["readings"],
      returns: "int",
      functionName: "longestRise",
    },
    tests: [
      {
        input: "5 2 8 6 3 6 9 7",
        expected: "4",
        isSample: true,
        explanation: "For example 2, 3, 6, 7 or 2, 3, 6, 9.",
      },
      {
        input: "4 4 4",
        expected: "1",
        isSample: true,
        explanation:
          "Equal scores are not rising, so any single score is the best run.",
      },
      { input: "", expected: "0" },
      { input: "42", expected: "1" },
      { input: "1 2 3 4 5", expected: "5" },
      { input: "5 4 3 2 1", expected: "1" },
      { input: "0 8 4 12 2 10 6 14 1 9", expected: "4" },
      { input: "-3 -1 -2 0 -5 2", expected: "4" },
      {
        input:
          "-7164 2542 8939 -4360 -6059 -2353 -6611 7418 1090 -4937 3846 -6942 -6824 -1675 1933 2956 7155 -6981 9256 310 8547 -5619 -1790 -2449 -742 -4598 -6939 -7530 4530 -7480 6319 -3160 -1731 -5487 -6096 9351 2607 -2294 -2754 -9789 -5429 -3023 6999 -6061 2797 -6438 -2928 5211 -5629 8796 9997 3647 -6020 4427 -9374 1284 -7512 -7736 2047 -8095 -1755 -286 9625 -3540 -7331 -6082 8062 -9438 -615 8049 7210 -6896 -311 -8938 3092 -7010 9008 -4415 -993 9225 -7392 -3110 -3483 6012 3038 -8241 -5778 -7011 -350 -397 4002 -1458 -7428 9848 454 -8195 8070 -8827 -7249 7563 6266 -5489 2598 6885 8228 -3414 -4417 1029 7898 9036 8472 2650 -1971 -5706 -7595 7633 -7710 -4564 7150 938 3415 -8285 -3886 3927 2583 -3648 -4750 5019 -1053 -714 -1511 -1566 -3252 -4766 -116 4122 -5826 6904 -1641 1672 9954 -6261 1561 9819 -7335 -441 9373 -9111 5486 9494 451 -808 -7914 -9327 7627 5635 -5103 -4531 -9765 -806 492 3338 3670 9200 -6739 -910 -5739 -181 9332 5486 4780 -4502 8423 -7741 -1914 9667 -6987 3804 6008 9137 -4157 5386 -5195 -6262 4826 462 5559 8623 -1841 1700 3354 -4002 -9258 -6917 4119 9059 7384 -7918 3480 -9399 -5673 8027 -7617 9145 8532 -8025 -7346 -3679 -838 -6139 6435 4595 -2211 -8673 -7414 -9187 -2959 -3605 8726 -6102 1518 -6359 5245 -4346 4943 -5941 -8571 -2886 -3024 3565 5488 9491 -9395 5989 -7511 -4074 6989 9666 6543 3826 -5494 -4851 6035 3976 3058 9277 5327 -4532 1038 3479 9527 -5079 -253 3123 9944 4462 -9193 5276 8240 8793 -2341 7372 4283 -1159 -2045 8164 6655 965 3994 6019 6561 -4879 -4314 8723 -2581 -8942 -6372 5496 -8380 -7894 9535 -2684 -3108 2601 -9347 -3372 9654 8494 -85 -2973 -5303 -379 7365 -5560 -8508 -2015 -3374 5097 -1779 5329 -8144 -4867 2834 -8353 4114 -7272 -2349 6221 -7735 -3210 -4215 -455 1958 3842 -131 6984 8279 -2987 5519 833 5442 -5153 6269 4138 842 8870 2273 -3618 -5423 -9952 1847 -6000 7457 -3743 -619 -9335 -4376 -128 2435 -4043 -6335 -9420 9790 738 -5647 5946 -4887 6666 -1145 -4000 3873 -9555 -3923 -6609 -7278 -4180 9561 9850 -2519 61 3040 -444 -8513 -6197 9734 7379 1059 4812 -1721 -5498 -6521 -2452 -9874 1995 -819 -8106 -8172 -8874 2589 3500 -1841 5232 8691 -4583 -5434 5707 4718 -3958 -434 7845 -6763 7288 -1581 -5182 -5000 9549 -7281 -3514 395 8348 -9858 -8034 -6687 -4090 -6126 7819 -2717 -1476 8326 -7600 1437 -4150 6857 8345 8867 1140 6518 -466 8172 4358 5251 -3605 8593 3136 -7348 385 1173 -5964 -2286 -7275 5637 7901 5182 1926 -5805 1225 -7309 -1698 4897 -3025 2135 -7364 6387 -3423 315 9146 4694 -1358 -8904 -7416 -9080 -1968 971 -9570 7018 -6286 1419 8257 6535 3484 -4501 2355 -6853 -5035 8998 3531 6308 -3980 -1216 6683 -7161 -813 -2150 7098 7500 -2647 6878 -1934 3239 5606 -1421 -3416 7852 -2990 1704 8245 4961 3167 -5283 9371 -6086 5577 928 2200 3639 6491 -6862 -3554 983 7073 -8563 -5466 7052 -5892 -3893 9517 3531 7575 -494 -4690 8843 8516 7807 4411 4728 3337 -4753 3314 4070 6436 -6830 -2338 2049 8937 -6176 -6426 3419 8992 -301 -8102 -7556 -8148 9790 7581 2811 6325 -9005 -1082 -1950 -3092 -2345 -2736 -3316 3163 3838 -6007 -2566 976 8310 -16 -1065 1573 -9485 1605 -5366 9073 5752 3864 7720 -3700 926 7427 -524 833 -7530 3993 -765 -5544 -180 -796 9850 8256 8678 1136 7204 -5543 8851 1689 -1118 -7324 -7733 -999 9912 -6994 1431 -1327 1077 -9250 -975 -178 -8478 -577 4398 6211 -2579 -2215 6320 8333 1406 -8277 6449 3098 -6411 -9359 5175 3344 -3009 -449 8581 9936 4514 -2267 3239 -8551 4455 5838 3351 -6719 6707 -4033 -5607 9526 8237 -3484 -164 -2567 -6661 6284 779 -7934 -3406 4872 3284 -6730 -7338 -6786 116 3376 -5746 -2368 3813 -4662 -9356 -2630 -2545 664 -8210 -7613 -123 -1820 6397 -7380 -9737 -958 -5284 -7539 9036 9533 -2216 524 3100 -406 3070 -7474 -2965 -8057 -1586 -2512 -8156 5050 8231 -632 8148 4957 2515 695 4200 -7158 2371 336 -6004 3043 -8972 5238 75 4185 -7306 -9771 -3359 -5016 -6157 8467 -520 -9327 -681 1724 8521 2859 4779 6464 929 4557 -8214 4511 5496 2936 9075 8266 1522 -7846 -2744 -745 6634 -7494 4034 7706 -7375 -4686 6228 6543 8411 -2352 8658 -3842 7152 6985 -8413 -2552 -6908 7878 -8389 -2733 -3569 -1284 5728 -7460 7132 9281 724 8522 4261 -7483 658 5023 7737 -4012 90 -6172 6735 -4065 -2948 -7715 3287 -3683 -5393 -9704 -4963 1779 -2917 3990 3335 8741 7842 8346 7398 9115 -5053 2879 3988 5290 1739 4944 -2179 -2810 2907 2113 5025 -1126 2594 3789 -5590 3007 -2886 -5026 930 7669 -6405 -8557 -5012 4631 1266 4965 -4642 8829 106 9710 -4573 -3430 1062 4790 -3625 -6219 -2827 9361 8610 1963 3917 -1420 8055 5554 1179 -297 6423 4267 -9684 9124 236 7444 -647 7836 9659 7170 8864 -8720 1995 -357 6003 3367 -1611 4614 1463 5236 -4181 2120 -8117 -6637 6200 2769 -3397 -5757 -1981 6945 -2704 -4468 -8853 6832 2009 7645 -7131 1206 -6425 -1336 9643 9051 -9503 -5015 -3498 8388 7681 -8267 8041 -8653 -2805 -2559 1744 -784 -4422 -8329 -7042 7966 2320 -3007 2688 4633 -3740 -7325 2808 1457 -6517 -1394 2505 9853 1158 6246 -2029 2386 -6770 -6753 -206 6872 -6136 -7460 -3990 9468 -9220 9997 -941 -8982 1963 -2947 9871 -8434 4623 -8681 3085 4867 34 3454 -6348 4227 5007 7046 -4714 -320 -2901 -238 7262 -912 8239 8009 2216 -7714 -4086 -1745 8 3385 -7112 243 -587 -4322 8282 -9222 3126 -2055 -2972 -9539 7080 -8522 4430 -2141 4966 8398 3747 -8976 4638 -7910 -8479 5638 -5949 -7422 4160 562 9680 -758 3506 5208 3157 -3806 3209 -49 483 6422 9899 1953 -7386 -6335 -3541 4751 6924 -8280 -4629 6563 -4405 9427 -2740 -5609 -3315 -698 -7549 3326 -7579 -9395 -239 -1065 9983 -6809 -4980 -5401 6356 -4484 8307 -1129 -3195 9047 8418 3598 -2290 9794 9135 -4570 -9141 8755 -2353 8414 -2230 -2106 -6575 -2221 2355 2942 -1673 2778 4470 8008 -5672 -3526 -7287 -9254 4226 4846 2762 -829 9876 -7828 -1660 2857 -8705 -1084 -2520 1910 9642 107 -6286 6275 -2400 4202 9900 -6101 7806 -5438 4984 -253 -9936 6752 9323 7047 9220 1461 3900 -9088 4653 -3429 3815 -4463 -2512 -8086 -7973 -461 -4303 -7165 235 -7921 30 -7449 -9471 -9711 4638 -5339 -7678 -9405 -288 -4182 5183 -1512 5049 3550 -2932 5120 -7784 -761 5344 -8327 -8948 1597 6061 6133 -4690 4226 -7639 4661 -5580 -319 -5076 -6674 -9168 -5366 -4874 3875 -9187 9113 1492 5338 -2699 -7860 4821 -8209 4322 5685 -4318 -9707 9834 9931 -2976 8589 -2817 -8997 -9557 -1050 -1118 9703 -5506 3616 -1892 -3984 7620 4016 5436 9007 8117 3189 856 -9373 3089 5634 8167 9624 -9199 -6431 -1501 -3211 4217 5308 -2251 9485 2996 8492 6110 7082 -1869 3732 3587 68 -9440 4330 6293 -324 -8797 -1806 2411 91 2240 -447 5748 4299 -4156 5038 -980 -6403 -7977 8111 -9432 -4826 -4345 -8721 1277 -6494 -1038 9562 5780 7465 5599 5748 2536 -2362 168 7526 -844 9460 -4138 6891 7487 1270 4809 9498 8449 -966 9325 -42 -8615 1874 7904 -4086 8414 9517 1070 -3306 -4685 -2145 709 5905 -1729 6147 -3075 5045 7645 -9003 4766 -3670 -3820 3658 5980 7487 8376 -6610 -3726 6980 -1892 235 -6306 -8873 6955 -894 -4734 928 -1507 6685 8446 -680 5211 5003 9908 5016 -5582 2499 -5975 -2290 9974 -3409 1101 -9596 -2800 8686 -2883 -6730 -4350 960 4140 6740 278 4507 5420 8949 8648 5058 -5380 5927 -79 6239 5836 -4775 7473 -8091 -3568 -1110 -6761 9319 -4194 9706 2364 -8188 -6583 8228 -8457 7223 1857 -1915 7291 -9901 -5517 -7468 -9131 -1859 2765 -1356 -1167 9220 2712 -6859 4338 -7265 -8215 2493 -8544 -308 -5970 9137 -2888 -1433 99 728 2926 -5504 -7306 -9279 9427 -4138 3854 746 6769 3893 4856 -4216 -2145 -3349 -464 8770 2276 4186 -9343 9144 -7276 -2692 -5999 -1325 4009 2091 4289 2039 8119 1831 -8605 -1500 6668 6533 2383 1188 1524 4612 7667 -4630 -1238 -1120 -4489 3696 926 -2261 440 -2385 -3002 2987 6085 -567 -9842 8723 -4503 7122 -8686 -7022 9731 1997 1176 2658 -4190 2811 -6286 -2413 -8139 -1097 -4573 4562 2731 -23 6808 -3685 2985 -6241 -2063 -6037 -7680 9903 -4600 5646 -5946 5768 9625 -8200 -7772 27 -5694 6850 7765 4490 1659 -2965 -2722 -6118 -4869 7889 1524 -9976 4159 -5796 -3794 1769 -1433 928 6681 5246 8741 2118 -1809 7912 -7684 -2384 3937 9686 6284 -2911 7747 -7012 -4306 9355 -8477 -4250 6042 8192 1132 -6277 6468 152 -8270 -121 -6187 2650 -3428 -4584 -2173 4226 -1247 6526 -1050 -7787 -5694 -935 4897 -2861 -370 6400 3922 -5239 659 -7816 -2877 1000 -4795 -6020 5410 2 -7894 -1327 6780 -655 5941 870 5729 -4055 -7345 7245 8528 6541 -4635 -5275 -2697 9506 1433 2333 4936 -1839 -6029 -5575 9996 -5281 6116 8955 4334 4267 -2747 7038 2385 -4146 8640 352 3377 7059 8030 9223 -7665 9499 703 -5328 5671 -8102 -9837 7547 6898 -5175 5614 -6475 9242 4025 787 7429 -3497 3179 6597 -3735 -6703 2766 9697 -8189 7505 -8458 -8881 6891 -6019 4750 2889 -773 3257 -299 -8279 -8239 4572 -897 -3317 6304 1810 -1010 -7686 -9363 4525 -3468 -4294 -6359 -6049 -2571 -1963 -3784 542 -7017 2902 9464 7384 3903 -5712 360 5665 -908 -9157 -7249 8351 -5577 6422 -2330 -3169 -5691 -7781 9114 -2569 -8573 660 -9396 -5245 -4951 8688 3934 -9468 -8992 2930 -4495 -4944 1838 -674 -9649 2238 2840 8198 8502 8932 1813 -5616 9334 6723 -6228 -4683 -5470 2260 6514 8023 7941 -3583 8898 -6339 7905 -24 -5679 8488 3544 8285 -1508 5399 355 7474 5773 8441 7860 -1169 1486 -5027 -952 -8060 3980 9559 4033 -7813 593 2497 -4461 5548 3547 -3580 -4899 -6903 -4506 -2991 -8334 -8380 1961 -3658 -6834 -4167 6651 8983 8488 -4994 7031 -8252 -1977 1818 -7835 -286 6681 6275 -955 93 -3097 -683 5234 -4688 5814 6492 9928 -6087 -9341 -9568 -4073 8976 -9403 1381 -370 -113 -1842 -5398 -3855 5773 -4658 1340 -6694 -1082 8324 5496 5589 7661 -6322 1709 -8835 -7552 728 -4874 3264 3790 9132 3401 -4000 -5945 -6297 -887 -4353 279 -871 -6256 -9973 -3022 5074 -5885 746 3985 7418 -2955 4354 2344 -1351 3336 3431 -5192 -7468 700 -5017 -8452 3811 -9653 2445 6060 -2039 7572 -2483 -8871 9394 -4369 1225 -2289 4560 4088 -5130 350 4524 -5022 7990 9495 -6319 8833 6195 6746 2859 3159 -8437 7728 -6770 6826 -831 -85 7075 6650 -2588 2491 -8468 -8304 -6418 -5465 3462 -1838 3589 -2032 -8807 1822 -8013 1849 6195 3387 -2874 2205 -8097 1292 3090 231 4179 -2913 990 4661 -4142 -294 1935 4902 136 -8527 4275 -6042 -6121 1097 1781 -1609 -1334 1774 -2720 556 -4057 4684 -7422 -2930 663 -1076 8137 375 5656 -2623 1777 2081 -9359 6135 -1296 -160 -6513 5720 -9639 4797 7599 -7360 2066 -9122 633 9052 -7931 -2357 -1224 1214 5149 1828 5069 -1725 -8264 8212 2454 -9971 -456 -2981 -9732 -912 6451 -6870 5090 -1163 5469 -3017 2970 3765 -7154 1789 -7348 6028 7715 2061 -292 8535 -7501 9974 -9389 2148 -3140 -9406 3363 9045 2760 6265 6058 9683 -684 652 8859 -515 6408 8911 7694 -7667 -7435 7659 7545 1938 -5354 7658 4220 -9686 5945 -6625 -2752 -5246 -6529 -479 472 8103 -5796 -6274 -9920 7916 3312 6962 2662 7017 -4461 4599 1168 -1201 7856 1389 4454 4290 7513 -8059 -1255 -9830 6007 6661 279 -2953 1239 -6906 3161 -6853 6370 4401 -3852 -78 703 8053 6239 -4501 -4966 1379 3945 -4332 -5517 6996 7732 -9103 -2487 -9593 -4790 -1263 5239 -4257 9034 8239 2619 9617 7689 -7677 1566 -4295 4323 3746 3169 -4142 4521 -975 2226 -5672 -9110 -4511 7812 2513 -6923 3716 7776 2257 -4165 3721 -770 -8497 5646 3651 -9632 3066 -9423 -6624 7150 3586 7703 2288 753 8453 7854 -3883 7244 4030 7813 -2091 -2535 -9209 -6687 9877 -5162",
        expected: "83",
      },
    ],
    hints: [
      "Let best[i] be the longest rising subsequence that ends exactly at reading i. How does it relate to earlier entries?",
      "best[i] = 1 + max(best[j]) over j < i with readings[j] < readings[i]. That is O(n²).",
      "For each possible length, only the smallest ending value matters: a smaller tail is easier to extend.",
      "Those smallest tails are sorted, so each new reading can binary search for the first tail that is not smaller than it and replace it.",
    ],
    solutions: [
      {
        title: "Table of best endings",
        order: 1,
        intuition:
          "Any rising subsequence ending at reading i is some rising subsequence ending at an earlier, smaller reading, plus reading i. So the best ending at i is one more than the best among those earlier candidates. Checking every earlier reading costs O(n) per position.",
        approach: [
          "Create best with every entry 1: each reading alone is a rising run.",
          "For each i, for each j < i with readings[j] < readings[i], set best[i] = max(best[i], best[j] + 1).",
          "Return the largest entry, or 0 for no readings.",
        ],
        code: {
          PYTHON: `def longestRise(readings: List[int]) -> int:
    n = len(readings)
    best = [1] * n  # best[i] = longest rise ending at reading i

    for i in range(n):
        for j in range(i):
            if readings[j] < readings[i]:
                best[i] = max(best[i], best[j] + 1)

    return max(best) if n else 0`,
          JAVA: `class Solution {
    public int longestRise(int[] readings) {
        int n = readings.length;
        int[] best = new int[n];
        int answer = 0;

        for (int i = 0; i < n; i++) {
            best[i] = 1;
            for (int j = 0; j < i; j++) {
                if (readings[j] < readings[i]) best[i] = Math.max(best[i], best[j] + 1);
            }
            answer = Math.max(answer, best[i]);
        }

        return answer;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        edgeCases: ["No readings: 0.", "Strictly decreasing readings: 1."],
        commonMistakes: [
          "Returning best[n - 1]; the longest run need not end at the last reading.",
          "Using ≤ instead of <, which lets equal scores count as rising.",
        ],
      },
      {
        title: "Optimal: smallest tails with binary search",
        order: 2,
        intuition:
          "Keep tails[k] = the smallest value that ends any rising subsequence of length k + 1 seen so far. Smaller tails dominate larger ones, because anything that extends the larger one also extends the smaller. The tails are strictly increasing, so a new reading either extends the longest (it is bigger than every tail) or lowers the first tail that is ≥ it. The length of tails is the answer. Note tails is not itself a valid subsequence, only a record of the best possible endings.",
        approach: [
          "Start with an empty tails list.",
          "For each reading, binary search for the first index whose tail is ≥ the reading.",
          "If that index is the end of the list, append; otherwise overwrite that tail.",
          "Return len(tails).",
        ],
        code: {
          PYTHON: `def longestRise(readings: List[int]) -> int:
    # tails[k] = smallest score that ends a rise of length k + 1
    tails = []

    for value in readings:
        lo, hi = 0, len(tails)
        while lo < hi:  # first tail that is >= value
            mid = (lo + hi) // 2
            if tails[mid] < value:
                lo = mid + 1
            else:
                hi = mid
        if lo == len(tails):
            tails.append(value)  # extends the longest rise
        else:
            tails[lo] = value  # a lower ending for length lo + 1

    return len(tails)`,
          JAVA: `class Solution {
    public int longestRise(int[] readings) {
        int[] tails = new int[readings.length];
        int size = 0;

        for (int value : readings) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < value) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = value;
            if (lo == size) size++;
        }

        return size;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Equal readings: the search for 'first tail ≥ value' replaces rather than extends.",
          "Negative readings.",
          "Already sorted readings: every value appends.",
        ],
        commonMistakes: [
          "Searching for the first tail strictly greater than the value, which counts equal scores as rising.",
          "Reporting the tails list as the subsequence itself; it is only a record of lengths.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "split-cargo-evenly",
    title: "Split the Cargo Evenly",
    difficulty: "MEDIUM",
    learningObjective:
      "Reduce a partition question to subset-sum and answer it with a reachable-sums table swept downward.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A small cargo plane has a left hold and a right hold, and it only flies level when both carry exactly the same weight. Every crate must go into one hold or the other, and crates cannot be split."
      ),
      para(
        "Given the crate weights, return true if the crates can be divided into two groups of equal total weight."
      ),
      example(
        "crates = [4, 1, 5, 9, 3, 2]",
        "true",
        [
          { state: "total = 24", note: "each hold needs 12" },
          {
            state: "reachable after 4, 1, 5: {0, 1, 4, 5, 6, 9, 10}",
            note: "sums some crates can make",
          },
          {
            state: "after 9: still {0, 1, 4, 5, 6, 9, 10}",
            note: "9 and 10 were already reachable; 13 and up exceed 12",
          },
          { state: "after 3: 12 = 9 + 3 is reachable", note: "left hold: 9 and 3" },
          {
            state: "right hold: 4 + 1 + 5 + 2 = 12",
            note: "the rest balances automatically",
          },
        ],
        "Looking for a group that weighs half the total"
      ),
    ],
    constraints: ["1 ≤ crates.length ≤ 200", "1 ≤ crates[i] ≤ 100"],
    signature: {
      params: ["int[]"],
      paramNames: ["crates"],
      returns: "bool",
      functionName: "canSplitEvenly",
    },
    tests: [
      {
        input: "4 1 5 9 3 2",
        expected: "true",
        isSample: true,
        explanation: "9 + 3 = 12 on one side and 4 + 1 + 5 + 2 = 12 on the other.",
      },
      {
        input: "2 3 4",
        expected: "false",
        isSample: true,
        explanation: "The total, 9, is odd, so the holds can never match.",
      },
      { input: "1", expected: "false" },
      { input: "6 6", expected: "true" },
      { input: "1 2 5", expected: "false" },
      { input: "1 1 1 1 1 1", expected: "true" },
      { input: "2 2 3 5", expected: "false" },
      { input: "100 99 1 50 50", expected: "true" },
      { input: "1 2 3 4 5 6 7", expected: "true" },
      { input: "3 3 3 4 5", expected: "true" },
      {
        input:
          "40 23 9 67 2 82 25 39 26 67 65 54 70 27 53 77 63 48 100 28 69 18 87 28 36 3 36 57 72 60 62 79 55 34 61 38 24 96 17 93 49 53 67 11 14 29 21 96 45 8 53 31 71 77 96 57 19 6 46 32 97 76 19 20 55 94 32 23 90 95 21 63 90 57 71 42 1 3 40 100 60 72 39 49 77 16 17 39 37 60 51 80 63 90 79 88 77 72 17 6 40 63 85 48 26 4 9 97 11 37 73 97 12 86 66 86 8 58 58 64 32 1 52 39 12 93 90 30 2 2 20 80 57 98 45 46 32 53 74 98 40 56 96 42 56 100 72 93 49 25 57 39 62 56 26 58 64 31 93 89 51 46 16 66 59 44 99 95 69 86 25 38 100 43 96 59 6 55 14 53 12 38 8 21 97 3 61 49 70 98 96 10 9 80 89 39 14 80 85 72",
        expected: "true",
      },
      {
        input:
          "44 96 12 78 68 1 1 24 74 4 88 60 74 76 14 70 72 96 8 2 10 84 84 10 86 96 20 36 86 40 56 90 40 74 26 72 72 60 14 16 16 34 56 28 24 40 84 90 80 66 40 88 10 14 32 60 64 18 98 84 16 22 8 64 52 96 62 66 34 10 76 70 84 12 36 30 40 12 94 96 76 90 60 46 14 92 80 38 66 98 20 14 84 90 86 96 16 6 90 68 60 100 12 86 86 24 36 44 58 36 6 90 92 40 16 86 78 46 92 88 86 16 50 90 28 72 26 4 40 90 74 36 18 40 14 62 100 12 72 22 36 94 4 62 18 58 76 28 66 24 48 78 100 42 96 36 10 26 40 94 90 38 28 32 30 92 66 36 26 94 72 60 80 94 36 48 96 48 26 6 62 52 54 18 10 68 92 56 48 12 84 14 34 10 34 64 2 74 26 2",
        expected: "true",
      },
      {
        input:
          "97 97 97 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2",
        expected: "false",
      },
    ],
    hints: [
      "If the total weight is odd, can the holds ever balance?",
      "If it is even, you only need to find one group weighing exactly half; the remaining crates are the other hold.",
      "Track which sums are reachable using the crates considered so far. Adding a crate w makes s + w reachable for every reachable s.",
      "Use a boolean array indexed by sum, and sweep it from high to low for each crate so that crate is not used twice.",
    ],
    solutions: [
      {
        title: "Brute force: every crate goes left or not",
        order: 1,
        intuition:
          "Pick a group for the left hold by deciding crate by crate. If any choice hits exactly half the total, the rest forms the right hold. That is 2ⁿ choices in the worst case.",
        approach: [
          "Return false at once if the total is odd.",
          "Recurse with an index and the weight still needed on the left.",
          "Needed 0: success. Out of crates or overshot: failure.",
          "Try putting the crate on the left, then try leaving it for the right.",
        ],
        code: {
          PYTHON: `def canSplitEvenly(crates: List[int]) -> bool:
    total = sum(crates)
    if total % 2 == 1:
        return False

    def fill(i: int, needed: int) -> bool:
        if needed == 0:
            return True
        if i == len(crates) or needed < 0:
            return False
        return fill(i + 1, needed - crates[i]) or fill(i + 1, needed)

    return fill(0, total // 2)`,
          JAVA: `class Solution {
    private int[] crates;

    public boolean canSplitEvenly(int[] crates) {
        this.crates = crates;
        int total = 0;
        for (int w : crates) total += w;
        if (total % 2 == 1) return false;
        return fill(0, total / 2);
    }

    private boolean fill(int i, int needed) {
        if (needed == 0) return true;
        if (i == crates.length || needed < 0) return false;
        return fill(i + 1, needed - crates[i]) || fill(i + 1, needed);
    }
}`,
        },
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["An odd total, rejected before any search."],
        commonMistakes: [
          "Forgetting the odd-total check and searching for a non-integer half.",
        ],
      },
      {
        title: "Optimal: reachable sums up to half",
        order: 2,
        intuition:
          "The only thing that matters about a partial choice is the sum it reaches, and sums are small (at most half the total). So keep a boolean for each sum from 0 to half: can some subset of the crates seen so far weigh exactly this much? Adding a crate w turns on s for every s whose s - w was already on. Sweeping s downward guarantees each crate is counted at most once.",
        approach: [
          "If the total is odd, return false. Otherwise half = total / 2.",
          "reachable[0] = true; every other entry false.",
          "For each crate w, for s from half down to w: if reachable[s - w], set reachable[s].",
          "Return reachable[half].",
        ],
        code: {
          PYTHON: `def canSplitEvenly(crates: List[int]) -> bool:
    total = sum(crates)
    if total % 2 == 1:
        return False
    half = total // 2

    # reachable[s]: some of the crates seen so far weigh exactly s
    reachable = [False] * (half + 1)
    reachable[0] = True

    for w in crates:
        for s in range(half, w - 1, -1):  # downward: each crate used once
            if reachable[s - w]:
                reachable[s] = True

    return reachable[half]`,
          JAVA: `class Solution {
    public boolean canSplitEvenly(int[] crates) {
        int total = 0;
        for (int w : crates) total += w;
        if (total % 2 == 1) return false;
        int half = total / 2;

        boolean[] reachable = new boolean[half + 1];
        reachable[0] = true;

        for (int w : crates) {
            for (int s = half; s >= w; s--) {
                if (reachable[s - w]) reachable[s] = true;
            }
        }

        return reachable[half];
    }
}`,
        },
        timeComplexity: "O(n × total)",
        spaceComplexity: "O(total)",
        edgeCases: [
          "A single crate can never balance.",
          "Two equal crates balance.",
          "One crate heavier than all the others combined.",
        ],
        commonMistakes: [
          "Sweeping sums upward, which lets one crate be added repeatedly.",
          "Searching for a split into contiguous groups; any crates may go together.",
        ],
      },
    ],
    expectedTime: "O(n × total)",
    expectedSpace: "O(total)",
  },

  {
    slug: "signed-sum-assignments",
    title: "Credits and Debits",
    difficulty: "MEDIUM",
    learningObjective:
      "Use algebra to turn a sign-assignment count into a subset-sum count, then count subsets with a one-dimensional table.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "An auditor is reconstructing a ledger. She knows the size of every entry but the sign column was lost: each entry was either a credit (+) or a debit (−). She also knows what the entries netted to."
      ),
      para(
        "Given the entry sizes and the net total, return how many ways of assigning a sign to every entry produce exactly that net. Entries are distinguished by position, so two equal entries with swapped signs are two different assignments, and an entry of 0 can take either sign."
      ),
      example(
        "values = [2, 1, 1, 2], target = 2",
        "3",
        [
          { state: "+2 −1 −1 +2 = 2", note: "assignment 1" },
          { state: "+2 +1 +1 −2 = 2", note: "assignment 2" },
          { state: "−2 +1 +1 +2 = 2", note: "assignment 3" },
          {
            state: "plus side must sum to (6 + 2) / 2 = 4",
            note: "so count subsets that sum to 4",
          },
        ],
        "The three signings that net 2"
      ),
    ],
    constraints: [
      "1 ≤ values.length ≤ 20",
      "0 ≤ values[i] ≤ 1000",
      "0 ≤ sum(values) ≤ 1000",
      "-1000 ≤ target ≤ 1000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["values", "target"],
      returns: "int",
      functionName: "countSignings",
    },
    tests: [
      {
        input: "2 1 1 2\n2",
        expected: "3",
        isSample: true,
        explanation: "+2 −1 −1 +2, +2 +1 +1 −2 and −2 +1 +1 +2.",
      },
      {
        input: "4 6\n1",
        expected: "0",
        isSample: true,
        explanation: "4 ± 6 is always even, so an odd net is impossible.",
      },
      { input: "5\n5", expected: "1" },
      { input: "5\n-5", expected: "1" },
      { input: "0 0 1\n1", expected: "4" },
      { input: "1 1 1 1 1\n3", expected: "5" },
      { input: "3 1 4 1 5 9\n-7", expected: "3" },
      { input: "7 3\n100", expected: "0" },
      {
        input: "4 38 19 17 4 11 32 28 2 27 23 21 3 24 16 10 30 19 6 10\n30",
        expected: "8600",
      },
    ],
    hints: [
      "Every entry has two choices, so trying all signings is 2ⁿ. Can you describe a signing more compactly?",
      "Call the sum of the positive entries P and the sum of the negative ones N. You know P + N and P − N.",
      "So P = (total + target) / 2 is fixed. If that is not a whole number, or target is out of range, the answer is 0.",
      "Now count the subsets whose sum is P with a table ways[s], sweeping s downward for each value.",
    ],
    solutions: [
      {
        title: "Brute force: try both signs for every entry",
        order: 1,
        intuition:
          "Walk through the entries, adding or subtracting each, and count the paths whose final total equals the target. Simple and correct, and exponential.",
        approach: [
          "Recurse with an index and the running net.",
          "At the end, count 1 if the net equals the target.",
          "Otherwise return the count with + values[i] plus the count with − values[i].",
        ],
        code: {
          PYTHON: `def countSignings(values: List[int], target: int) -> int:
    def count(i: int, net: int) -> int:
        if i == len(values):
            return 1 if net == target else 0
        return count(i + 1, net + values[i]) + count(i + 1, net - values[i])

    return count(0, 0)`,
          JAVA: `class Solution {
    private int[] values;
    private int target;

    public int countSignings(int[] values, int target) {
        this.values = values;
        this.target = target;
        return count(0, 0);
    }

    private int count(int i, int net) {
        if (i == values.length) return net == target ? 1 : 0;
        return count(i + 1, net + values[i]) + count(i + 1, net - values[i]);
    }
}`,
        },
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["Zero entries double the count, because +0 and −0 are both valid."],
        commonMistakes: [
          "Stopping early when the net equals the target before all entries are signed.",
        ],
      },
      {
        title: "Optimal: count subsets of the positive side",
        order: 2,
        intuition:
          "A signing splits the entries into a positive group P and a negative group N with P + N = total and P − N = target. Adding the equations, P = (total + target) / 2, a fixed number. So each valid signing corresponds to exactly one subset summing to that number, and counting those subsets is a classic table: ways[s] is the number of subsets of the entries seen so far that sum to s.",
        approach: [
          "Compute total. If |target| > total or total + target is odd, return 0.",
          "goal = (total + target) / 2.",
          "ways[0] = 1. For each value v, for s from goal down to v: ways[s] += ways[s - v].",
          "Return ways[goal].",
        ],
        code: {
          PYTHON: `def countSignings(values: List[int], target: int) -> int:
    total = sum(values)
    if abs(target) > total or (total + target) % 2 == 1:
        return 0
    goal = (total + target) // 2  # what the + entries must add up to

    ways = [0] * (goal + 1)  # ways[s] = subsets so far with sum s
    ways[0] = 1

    for v in values:
        for s in range(goal, v - 1, -1):  # downward: each entry once
            ways[s] += ways[s - v]

    return ways[goal]`,
          JAVA: `class Solution {
    public int countSignings(int[] values, int target) {
        int total = 0;
        for (int v : values) total += v;
        if (Math.abs(target) > total || (total + target) % 2 == 1) return 0;
        int goal = (total + target) / 2;

        int[] ways = new int[goal + 1];
        ways[0] = 1;

        for (int v : values) {
            for (int s = goal; s >= v; s--) {
                ways[s] += ways[s - v];
            }
        }

        return ways[goal];
    }
}`,
        },
        timeComplexity: "O(n × total)",
        spaceComplexity: "O(total)",
        edgeCases: [
          "A negative target, handled by the same formula.",
          "A target further from 0 than the total can reach.",
          "Entries of 0, which the downward sweep doubles correctly (ways[s] += ways[s]).",
        ],
        commonMistakes: [
          "Skipping the parity check and dividing an odd number by 2.",
          "Sweeping upward, which lets one entry join the subset several times.",
          "Treating zeros specially when the table already handles them.",
        ],
      },
    ],
    expectedTime: "O(n × total)",
    expectedSpace: "O(total)",
  },

  {
    slug: "count-digit-decodings",
    title: "Readings of a Pager Message",
    difficulty: "MEDIUM",
    learningObjective:
      "Count the ways to parse a string where each step consumes one or two characters, with validity rules on each piece.",
    topics: ["dynamic-programming", "strings"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "An old pager sends text by replacing each letter with its position in the alphabet, A = 1 up to Z = 26, and then running the numbers together with no separators. A message like 1226 is ambiguous: it could be several different words."
      ),
      para(
        "Given the digit string, return how many different letter sequences it could stand for. A piece that starts with 0 (such as 0 or 06) is never a letter, and neither is any number above 26."
      ),
      example(
        'digits = "1226"',
        "5",
        [
          { state: '"1": 1 reading', note: "A" },
          { state: '"12": 2 readings', note: "A B, L" },
          { state: '"122": 3 readings', note: "add 2 alone (2) + add 22 (1)" },
          {
            state: '"1226": 3 + 2 = 5',
            note: "6 alone after any of 3, or 26 after any of 2",
          },
        ],
        "Readings of each prefix"
      ),
    ],
    constraints: [
      "1 ≤ digits.length ≤ 200",
      "digits contains only the characters 0-9.",
      "The answer fits in a 32-bit signed integer.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["digits"],
      returns: "int",
      functionName: "countDecodings",
    },
    tests: [
      {
        input: "1226",
        expected: "5",
        isSample: true,
        explanation: "1 2 2 6, 12 2 6, 1 22 6, 1 2 26 and 12 26.",
      },
      {
        input: "301",
        expected: "0",
        isSample: true,
        explanation: "30 is not a letter and 0 cannot stand alone, so nothing decodes.",
      },
      { input: "7", expected: "1" },
      { input: "0", expected: "0" },
      { input: "10", expected: "1" },
      { input: "100", expected: "0" },
      { input: "2611055971756562", expected: "4" },
      { input: "1111111111", expected: "89" },
      { input: "27", expected: "1" },
      { input: "06", expected: "0" },
      {
        input:
          "225517414188371012572142810344458910973534847753389738859239910492188971172910557571013172195853231292917781025228321021",
        expected: "2985984",
      },
    ],
    hints: [
      "Think about how the last letter of a reading was written: one digit or two.",
      "A single digit is valid unless it is 0. A pair is valid when it is between 10 and 26.",
      "readings(i) = (last digit valid ? readings(i - 1) : 0) + (last pair valid ? readings(i - 2) : 0).",
      "Only the previous two counts are ever needed.",
    ],
    solutions: [
      {
        title: "Brute force: peel off one or two digits",
        order: 1,
        intuition:
          "From the front, the first letter used either one digit or two. Try both when valid and recurse on the rest. A long run of 1s and 2s makes this branch like Fibonacci, exponentially.",
        approach: [
          "Reaching the end of the string completes one reading.",
          "A piece starting with 0 is invalid: return 0.",
          "Count the readings after taking one digit, plus after taking two when the pair is at most 26.",
        ],
        code: {
          PYTHON: `def countDecodings(digits: str) -> int:
    def count(i: int) -> int:
        if i == len(digits):
            return 1
        if digits[i] == "0":
            return 0  # no letter starts with 0
        total = count(i + 1)
        if i + 1 < len(digits) and int(digits[i:i + 2]) <= 26:
            total += count(i + 2)
        return total

    return count(0)`,
          JAVA: `class Solution {
    private String digits;

    public int countDecodings(String digits) {
        this.digits = digits;
        return count(0);
    }

    private int count(int i) {
        if (i == digits.length()) return 1;
        if (digits.charAt(i) == '0') return 0;
        int total = count(i + 1);
        if (i + 1 < digits.length() && Integer.parseInt(digits.substring(i, i + 2)) <= 26) {
            total += count(i + 2);
        }
        return total;
    }
}`,
        },
        timeComplexity: "O(φⁿ) in the worst case",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["A leading 0, which has no readings at all."],
        commonMistakes: ['Accepting "06" as the letter F.'],
      },
      {
        title: "Optimal: two rolling counts",
        order: 2,
        intuition:
          "The number of readings of a prefix depends only on how its last letter was formed. If the last digit alone is valid, every reading of the prefix one shorter extends; if the last two digits form 10 to 26, every reading of the prefix two shorter extends. Carry the previous two counts forward.",
        approach: [
          "twoBack = 1 (the empty prefix); oneBack = 1 if the first digit is not 0, else 0.",
          "For each later position i: here = 0.",
          "If digits[i] is not 0, add oneBack. If digits[i - 1..i] is between 10 and 26, add twoBack.",
          "Shift the pair. Return oneBack.",
        ],
        code: {
          PYTHON: `def countDecodings(digits: str) -> int:
    # two_back = readings of digits[:i - 1], one_back = readings of digits[:i]
    two_back, one_back = 1, (0 if digits[0] == "0" else 1)

    for i in range(1, len(digits)):
        here = 0
        if digits[i] != "0":
            here += one_back  # last letter is this digit alone
        pair = digits[i - 1:i + 1]
        if "10" <= pair <= "26":
            here += two_back  # last letter is the two-digit pair
        two_back, one_back = one_back, here

    return one_back`,
          JAVA: `class Solution {
    public int countDecodings(String digits) {
        int twoBack = 1;
        int oneBack = digits.charAt(0) == '0' ? 0 : 1;

        for (int i = 1; i < digits.length(); i++) {
            int here = 0;
            if (digits.charAt(i) != '0') here += oneBack;
            int pair = (digits.charAt(i - 1) - '0') * 10 + (digits.charAt(i) - '0');
            if (pair >= 10 && pair <= 26) here += twoBack;
            twoBack = oneBack;
            oneBack = here;
        }

        return oneBack;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A single 0: no readings.",
          '"10": only J, because 0 cannot stand alone.',
          '"100": the second 0 can neither stand alone nor pair as 00, so 0 readings.',
          '"30": 30 is too large and 0 cannot stand alone.',
        ],
        commonMistakes: [
          "Treating any two digits as a valid pair, including 06 and 27.",
          "Continuing to count after a 0 that cannot be used, instead of letting the count drop to 0.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "segment-the-hashtag",
    title: "Segment the Hashtag",
    difficulty: "MEDIUM",
    learningObjective:
      "Mark which prefixes of a string can be fully split, and decide each one from shorter prefixes already decided.",
    topics: ["dynamic-programming", "strings"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A social media tool tries to make hashtags readable by splitting them back into words. A hashtag like sunsetbeach is readable if it can be cut into pieces that are all in the tool's word list."
      ),
      para(
        "Given the hashtag text (without the #) and the word list, return true if the whole text can be split into one or more listed words. A word may be used any number of times."
      ),
      example(
        'tag = "sunsetbeach", words = ["sun", "sunset", "set", "beach", "bea"]',
        "true",
        [
          { state: 'can_end[3] ← "sun"', note: "a split can end after sun" },
          {
            state: 'can_end[6] ← "sunset" (or "set" after sun)',
            note: "two ways, one is enough",
          },
          {
            state: 'can_end[9] ← "bea" after position 6',
            note: "a dead end, but marked",
          },
          {
            state: 'can_end[11] ← "beach" after position 6',
            note: "the whole tag splits",
          },
        ],
        "Positions where a complete split can end"
      ),
    ],
    constraints: [
      "1 ≤ tag.length ≤ 300",
      "1 ≤ words.length ≤ 100",
      "1 ≤ words[i].length ≤ 20",
      "tag and every word contain lowercase English letters only.",
    ],
    signature: {
      params: ["string", "string[]"],
      paramNames: ["tag", "words"],
      returns: "bool",
      functionName: "canSegment",
    },
    tests: [
      {
        input: "sunsetbeach\n5\nsun\nsunset\nset\nbeach\nbea",
        expected: "true",
        isSample: true,
        explanation: "sunset + beach, or sun + set + beach.",
      },
      {
        input: "gonefishing\n4\ngone\nfish\ngo\nfin",
        expected: "false",
        isSample: true,
        explanation:
          "After gone or go, the rest (fishing or nefishing) cannot be completed: ing is not a word.",
      },
      { input: "a\n1\na", expected: "true" },
      { input: "ab\n1\na", expected: "false" },
      { input: "aaaaaaa\n2\naaaa\naaa", expected: "true" },
      { input: "catsandog\n5\ncats\ndog\nsand\nand\ncat", expected: "false" },
      { input: "abcd\n4\na\nabc\nb\ncd", expected: "true" },
      {
        input:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab\n6\na\naa\naaa\naaaa\naaaaa\naaaaaa",
        expected: "false",
      },
      {
        input:
          "abababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab\n5\na\nb\nab\nba\naba",
        expected: "true",
      },
    ],
    hints: [
      "Try every word that the tag starts with, and recurse on what is left. Why is that slow on something like aaaaaaaab?",
      "The leftover after any choice is always a suffix of the tag, and there are only n + 1 of those.",
      "Let canEnd[k] mean 'the first k characters split into words'. canEnd[0] is true.",
      "canEnd[k] is true if some word w ends at k, starts at a position j = k − len(w) with canEnd[j] true.",
    ],
    solutions: [
      {
        title: "Brute force: try every first word",
        order: 1,
        intuition:
          "If the tag can be split, its first piece is some listed word. Try each word that matches the front and recurse on the remainder. Failed remainders are re-explored every time a different prefix leads to them, which on inputs like aaaa…ab is exponential.",
        approach: [
          "If the start index reaches the end, the split is complete.",
          "For each word that matches at the start index, recurse past it.",
          "Return true if any branch succeeds.",
        ],
        code: {
          PYTHON: `def canSegment(tag: str, words: List[str]) -> bool:
    def splits_from(start: int) -> bool:
        if start == len(tag):
            return True
        for word in words:
            if tag.startswith(word, start) and splits_from(start + len(word)):
                return True
        return False

    return splits_from(0)`,
          JAVA: `class Solution {
    private String tag;
    private String[] words;

    public boolean canSegment(String tag, String[] words) {
        this.tag = tag;
        this.words = words;
        return splitsFrom(0);
    }

    private boolean splitsFrom(int start) {
        if (start == tag.length()) return true;
        for (String word : words) {
            if (tag.startsWith(word, start) && splitsFrom(start + word.length())) return true;
        }
        return false;
    }
}`,
        },
        timeComplexity: "Exponential in the worst case",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["A tag that is itself a single listed word."],
        commonMistakes: [
          "Greedily taking the longest matching word and never backing off.",
        ],
      },
      {
        title: "Optimal: which prefixes can be split",
        order: 2,
        intuition:
          "Whether the rest of the tag splits depends only on where you are, not how you got there. Flip that around and work forwards: a prefix of length k splits exactly when some listed word ends at k and the prefix before that word also splits. Each prefix is decided once, from shorter prefixes already decided.",
        approach: [
          "canEnd has n + 1 entries, with canEnd[0] = true.",
          "For each end from 1 to n, for each word: let start = end − len(word).",
          "If start ≥ 0, canEnd[start] is true, and tag[start:end] equals the word, set canEnd[end] and stop checking words.",
          "Return canEnd[n].",
        ],
        code: {
          PYTHON: `def canSegment(tag: str, words: List[str]) -> bool:
    n = len(tag)
    # can_end[k]: tag[:k] splits completely into listed words
    can_end = [False] * (n + 1)
    can_end[0] = True

    for end in range(1, n + 1):
        for word in words:
            start = end - len(word)
            if start >= 0 and can_end[start] and tag[start:end] == word:
                can_end[end] = True
                break

    return can_end[n]`,
          JAVA: `class Solution {
    public boolean canSegment(String tag, String[] words) {
        int n = tag.length();
        boolean[] canEnd = new boolean[n + 1];
        canEnd[0] = true;

        for (int end = 1; end <= n; end++) {
            for (String word : words) {
                int start = end - word.length();
                if (start >= 0 && canEnd[start] && tag.startsWith(word, start)) {
                    canEnd[end] = true;
                    break;
                }
            }
        }

        return canEnd[n];
    }
}`,
        },
        timeComplexity: "O(n × W × L) for W words of length up to L",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A trailing character that no word covers: false, however well the rest splits.",
          "Several words sharing a prefix (sun / sunset): both paths are recorded.",
          "Repeated use of the same word.",
        ],
        commonMistakes: [
          "Checking the word before checking canEnd[start], which does needless string comparisons.",
          "Returning true as soon as any word matches, without confirming the whole tag is covered.",
        ],
      },
    ],
    expectedTime: "O(n × W × L)",
    expectedSpace: "O(n)",
  },

  {
    slug: "strongest-product-stretch",
    title: "Strongest Amplifier Chain",
    difficulty: "MEDIUM",
    learningObjective:
      "Carry both the largest and the smallest running product, because a negative factor swaps their roles.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A signal passes through a row of amplifier stages. Each stage multiplies the signal by an integer gain; a negative gain also inverts the signal, and a gain of 0 kills it. An engineer may tap the signal in and out around any contiguous run of stages, but must use at least one stage."
      ),
      para("Return the largest product of gains over any contiguous run of stages."),
      example(
        "factors = [2, -3, -2, 4, -1]",
        "48",
        [
          { state: "2: high 2, low 2", note: "best 2" },
          { state: "-3: high -3, low -6", note: "the sign flips which is large" },
          { state: "-2: high 12, low 6", note: "(-6) × (-2) = 12" },
          { state: "4: high 48, low 4", note: "best 48 = 2 × -3 × -2 × 4" },
          { state: "-1: high -4, low -48", note: "best stays 48" },
        ],
        "Largest and smallest product ending at each stage"
      ),
    ],
    constraints: [
      "1 ≤ factors.length ≤ 20000",
      "-10 ≤ factors[i] ≤ 10",
      "The product of any contiguous run fits in a 32-bit signed integer.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["factors"],
      returns: "int",
      functionName: "maxStretchProduct",
    },
    tests: [
      {
        input: "2 -3 -2 4 -1",
        expected: "48",
        isSample: true,
        explanation:
          "2 × −3 × −2 × 4 = 48; including the final −1 would flip the sign.",
      },
      {
        input: "-2 0 -1",
        expected: "0",
        isSample: true,
        explanation: "The 0 alone beats either negative stage.",
      },
      { input: "-5", expected: "-5" },
      { input: "0", expected: "0" },
      { input: "-2 -3", expected: "6" },
      { input: "3 -1 4", expected: "4" },
      { input: "-1 -2 -3 0 2", expected: "6" },
      { input: "2 3 -2 4", expected: "6" },
      { input: "-2 3 -4", expected: "24" },
      {
        input:
          "-2 1 -1 1 -1 1 1 1 -1 -2 -1 1 -3 -3 1 1 -3 1 -3 1 -1 -2 1 -3 1 -1 -1 1 2 -2 -3 1 1 2 1 0 1 1 1 1 1 0 1 1 -2 -1 -1 1 -1 1 1 1 -2 -3 2 -1 1 1 1 1 -3 -1 -1 -1 1 1 1 -1 2 -1 2 2 1 -2 0 1 1 -1 2 2 -1 2 1 -1 -2 -1 1 1 1 1 -1 0 -2 1 1 1 -1 -1 1 -1 1 -2 -1 -1 0 1 -1 1 1 1 -1 -1 2 -1 -3 -2 -1 1 1 -3 1 2 1 -1 1 1 1 1 1 -2 1 -1 0 1 1 1 1 -2 1 1 1 -1 1 2 -1 0 -3 1 1 1 1 1 -1 2 1 1 -1 1 -1 -3 -1 -3 1 -2 -1 2 -2 1 -1 -1 2 1 1 1 1 -3 1 -2 1 2 0 1 1 1 -3 1 -3 1 1 -1 -2 -1 1 -3 -2 1 1 1 1 1 -1 -1 1 1 1 1 0 1 1 2 -2 1 1 1 -2 1 1 1 2 -2 -3 -1 1 1 0 1 1 1 1 1 -1 -3 2 1 -1 -2 1 1 -1 -1 1 1 -1 -3 2 1 1 1 -1 1 1 -1 -2 1 -1 1 1 1 -3 -1 -1 -1 0 1 -1 -2 1 -2 -3 1 -1 -2 -2 1 -1 1 1 1 -1 -1 0 1 1 1 -1 1 -1 0 2 -1 1 1 1 1 1 1 -1 1 0 1 -1 -1 1 1 1 -1 1 -3 1 1 -1 -1 -1 -2 -1 1 -1 1 -2 1 -1 -3 1 1 1 -1 -1 1 1 1 1 -1 -1 0 1 1 1 -1 -1 1 -3 1 2 -1 -1 1 -1 1 -1 -2 1 -1 -2 1 -1 2 1 -1 -1 1 1 1 1 2 1 1 1 -1 1 -1 -2 -2 0 1 1 1 -1 1 -1 1 -3 1 -2 1 2 1 -1 1 1 1 1 1 -1 1 -2 -2 1 2 1 1 -1 1 2 -2 -2 -1 -3 -2 1 2 0 -1 1 2 1 1 1 -1 2 -1 -1 -1 1 -1 0 -3 1 1 -1 -2 1 1 1 -1 -1 1 -3 -2 2 1 1 1 1 -1 1 1 1 -1 -1 1 -3 1 1 1 1 -1 -1 -1 1 -2 -3 -1 1 1 0 1 1 1 1 1 -1 -1 -3 1 -2 1 1 1 1 1 1 1 -1 1 -3 2 1 -1 -1 1 1 1 1 0 -1 1 -2 1 -1 -3 1 1 1 1 -2 1 1 0 1 1 -1 -2 1 -1 -1 1 0 -1 2 1 -2 -3 1 1 -1 0 1 1 -1 1 -1 1 1 1 1 -2 1 1 1 1 -1 2 -3 -3 1 -1 1 -1 1 1 1 1 -1 0 -2 -2 1 1 -1 1 1 -1 2 -2 1 1 1 -1 1 -2 -1 1 -1 -1 -3 -1 1 1 2 -1 -3 0 1 1 1 1 1 1 1 1 -2 2 1 1 -2 1 1 -3 1 2 -2 1 1 2 1 0 1 2 -1 1 1 1 -1 1 -1 -3 1 1 -1 1 -1 2 -3 1 1 -1 -2 1 -1 1 -2 -1 -1 -1 0 1 -1 1 -1 1 1 -1 1 1 2 1 2 2 2 -3 -3 1 -2 1 2 1 1 -1 1 1 1 1 -1 2 0 1 -2 1 2 -1 -2 -1 -1 -1 1 1 -1 1 1 1 -1 1 -1 2 -1 -1 2 1 1 -1 1 -3 1 1 1 -1 1 -1 1 0 -1 1 2 1 -1 1 1 1 1 -1 1 0 -1 1 -1 -1 -3 2 1 -2 1 -1 1 -1 -2 2 2 2 1 -1 1 1 -2 -1 1 1 -3 -3 1 -2 -3 -1 1 1 -1 0 1 -2 -1 1 1 1 1 1 -1 -2 1 1 -2 1 -1 1 1 1 1 1 -3 1 2 1 1 0 -1 1 -1 1 1 1 -2 -3 1 -3 -1 -1 1 1 -1 -1 -3 -1 1 1 -2 1 2 1 -2 -1 0 1 1 -1 1 -1 2 -2 -1 2 1 1 1 -3 -1 1 1 -2 -2 -1 1 -1 1 1 1 -3 -1 1 1 1 1 2 -1 -1 2 1 0 -3 1 1 1 -3 2 -1 -1 1 -2 1 1 -1 -3 1 1 1 -1 -1 1 1 -1 -2 1 1 -2 -2 1 1 1 1 2 -2 -2 0 1 1 2 1 -1 1 1 -1 1 -2 1 -2 -1 2 -1 1 2 -1 1 1 -1 -1 -1 1 1 1 1 1 1 1 -1 1 0 -1 1 1 2 -1 1 -1 -1 1 1 -1 0 1 -1 -1 1 1 1 -2 1 2 1 -2 1 1 1 -2 1 0 1 1 -2 1 -3 1 -2 -2 1 1 -3 1 1 1 1 -1 2 -2 -1 2 -3 -1 1 -1 -3 -3 1 -1 1 -1 -2 -3 -1 1 -2 1 -1 0 1 2 -1 1 2 1 1 -3 -1 1 -1 1 1 -3 -2 0 -2 -1 2 1 1 1 2 1 1 1 -3 1 1 1 1 1 2 1 1 1 0 2 1 -1 1 1 0 1 1 -1 -1 -1 1 1 1 2 1 1 1 -2 -1 1 1 0 1 1 1 1 1 1 -1 -2 -2 -2 -1 1 1 2 1 1 1 -1 1 1 -2 -1 2 1 -1 1 1 1 1 0 -2 1 -1 -2 2 -3 1 -1 -1 -1 1 -2 1 1 -1 1 1 1 2 1 -3 1 1 1 1 2 -2 1 1 1 -1 -3 -3 -1 1 0 -1 1 1 1 1 1 1 -1 -3 -3 1 1 1 -1 1 1 -1 -1 1 1 1 1 -2 1 1 -2 -2 -3 1 -1 1 1 -2 -1 0 1 1 1 1 1 -1 1 -2 -1 -1 -1 1 -2 1 1 -1 1 1 0 -1 1 1 1 1 1 -2 -3 -1 -1 1 -1 -1 -1 1 1 1 1 1 2 2 1 1 -3 1 1 1 -2 1 1 0 1 -3 1 2 1 -2 -1 1 1 1 1 1 1 1 0 1 1 1 1 -2 1 1 1 1 1 -3 -2 1 -1 1 1 1 1 1 1 1 1 1 2 1 -1 1 -3 1 1 1 1 -1 1 1 1 0 2 -1 1 -1 -1 2 -2 -1 1 1 -1 1 1 1 -1 1 -1 -2 1 1 -1 -1 -1 1 1 -2 1 -1 1 1 1 -1 -1 -1 0 1 1 1 1 -1 -1 -1 1 1 -1 -1 1 1 -1 1 -1 1 2 1 1 -1 1 -1 1 1 1 -3 1 1 1 1 1 1 1 2 2 2 2 1 0 1 1 1 -2 1 1 1 -1 1 -2 1 0 1 -1 1 1 2 1 1 1 -2 -3 1 1 1 2 -2 1 1 1 1 1 1 -2 0 -3 1 -3 1 -2 1 -2 2 0 -1 -1 -3 -1 1 -1 2 -2 -1 -3 1 1 1 -1 -3 1 2 -1 1 0 1 1 -3 -1 1 -3 1 -1 0 1 -1 -1 1 1 1 1 1 -1 -2 1 1 1 1 1 1 1 1 2 2 1 -1 -1 -1 -1 -1 -2 1 -3 -1 1 1 -1 -2 2 -1 1 1 0 1 1 -1 1 1 0 1 1 1 1 2 -3 2 1 1 0 -1 2 -1 1 1 1 -1 -1 -1 1 1 -1 1 -1 1 1 -3 1 2 1 1 -1 0 -3 1 -1 -2 1 2 -3 -1 1 -1 1 1 -3 -1 -1 1 1 2 1 -1 1 1 -3 1 2 1 1 1 1 -1 1 -1 0 -1 -1 -1 1 -3 1 1 1 1 -3 2 1 1 1 1 1 1 1 1 -1 1 -3 -3 -3 0 1 -1 1 1 1 1 2 -1 -1 1 2 1 -1 -1 -3 2 2 1 -2 1 2 -1 1 0 -2 -1 1 -2 -1 -1 -1 -1 -3 1 1 -2 -1 -1 1 1 1 1 1 -2 -1 -1 1 -2 -1 0 -3 2 2 1 1 1 -2 1 1 1 1 2 1 1 -1 1 -1 1 -1 1 2 1 -1 1 -1 -1 -3 -2 -1 -2 -1 1 -3 0 1 1 -2 1 -1 -3 1 1 1 1 -2 1 -1 2 1 1 1 1 -3 -2 -2 1 -1 1 -1 1 -1 -1 1 -1 1 0 1 1 1 -3 1 1 1 2 1 2 1 -2 1 -1 1 1 1 1 2 -3 1 1 1 -1 -3 -1 1 1 -1 1 1 1 2 0 -3 -1 -3 -3 1 -1 -1 -2 -1 1 -3 -1 1 -2 1 1 1 -1 -1 -1 -2 -1 1 2 -1 1 -2 1 -1 -1 -1 1 0 -3 -1 -1 -1 1 1 1 1 1 1 -3 2 -1 1 1 -1 1 1 1 1 2 -1 -1 1 1 -3 1 1 -1 -1 2 -2 -1 2 1 1 -2 -3 -2 1 0 1 -1 -1 2 -1 1 1 2 1 -2 -1 1 -1 -1 1 1 1 1 1 -1 1 1 0 1 -1 -1 -2 -1 -1 -1 1 1 1 -1 1 1 -3 -3 0 1 1 2 -3 1 1 -2 -2 1 1 -3 -1 1 1 -2 -1 -1 1 -1 -3 1 1 1 2 -1 1 -2 2 -3 1 1 0 -1 1 1 -1 -2 1 1 -3 -1 -1 -1 -1 -3 0 -2 2 -2 -1 1 -1 1 1 1 1 1 -1 1 -3 1 -3 1 1 -1 2 0 1 1 1 1 -2 0 -2 1 -1 1 -1 -2 1 -1 -1 -3 -3 0 -3 1 1 1 -1 -3 1 -1 1 -2 1 1 -1 1 -2 -1 -3 -1 1 -1 1 1 -1 -1 1 2 2 2 1 -2 -1 -2 1 -2 1 -1 0 1 1 -1 1 -1 1 -2 -3 1 0 -3 1 1 -1 1 1 -1 1 0 -1 1 1 1 1 -1 -1 1 1 1 2 -1 1 1 1 -3 1 0 -2 1 -2 -3 1 1 -3 -3 -1 -2 1 1 -1 -3 -3 -1 -1 1 0 1 -1 -1 1 1 1 1 -2 2 1 1 -1 -2 1 1 1 2 1 1 -1 1 1 2 -1 1 1 2 -2 1 -2 2 -1 2 -1 0 1 -1 -1 -1 -1 1 1",
        expected: "186624",
      },
    ],
    hints: [
      "For sums, you would track the best run ending at each position. Why does that alone fail for products?",
      "A very negative product becomes very positive after one more negative factor.",
      "Track both the largest and the smallest product of a run ending at the current stage.",
      "The new largest is the max of: the factor alone, old largest × factor, old smallest × factor. Same idea for the new smallest.",
    ],
    solutions: [
      {
        title: "Brute force: every run",
        order: 1,
        intuition:
          "Fix a start stage and multiply forwards, recording every product along the way. All n(n + 1)/2 runs are checked.",
        approach: [
          "For each start i, keep a running product and extend it one stage at a time.",
          "Update the best after every extension.",
        ],
        code: {
          PYTHON: `def maxStretchProduct(factors: List[int]) -> int:
    best = factors[0]
    for i in range(len(factors)):
        product = 1
        for j in range(i, len(factors)):
            product *= factors[j]
            best = max(best, product)
    return best`,
          JAVA: `class Solution {
    public int maxStretchProduct(int[] factors) {
        int best = factors[0];
        for (int i = 0; i < factors.length; i++) {
            int product = 1;
            for (int j = i; j < factors.length; j++) {
                product *= factors[j];
                best = Math.max(best, product);
            }
        }
        return best;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["A single negative stage: the answer is that negative gain."],
        commonMistakes: [
          "Initialising the best to 0, which is wrong when every run is negative.",
        ],
      },
      {
        title: "Optimal: running high and low",
        order: 2,
        intuition:
          "The best run ending at stage i is either the stage alone or a run ending at i − 1 extended by it. Which earlier run? If the gain is positive, the largest; if it is negative, the smallest (most negative), because the sign flips. Keeping both extremes covers every case, and a 0 naturally resets both to 0 so the next stage starts fresh.",
        approach: [
          "Set best, high and low to the first factor.",
          "For each later factor x, form the candidates x, high × x and low × x.",
          "high becomes the largest candidate and low the smallest.",
          "Update best with high. Return best.",
        ],
        code: {
          PYTHON: `def maxStretchProduct(factors: List[int]) -> int:
    # high / low = largest / smallest product of a run ending here
    best = high = low = factors[0]

    for x in factors[1:]:
        candidates = (x, high * x, low * x)  # start fresh, or extend either
        high = max(candidates)
        low = min(candidates)
        best = max(best, high)

    return best`,
          JAVA: `class Solution {
    public int maxStretchProduct(int[] factors) {
        int best = factors[0], high = factors[0], low = factors[0];

        for (int i = 1; i < factors.length; i++) {
            int x = factors[i];
            int a = high * x, b = low * x;
            high = Math.max(x, Math.max(a, b));
            low = Math.min(x, Math.min(a, b));
            best = Math.max(best, high);
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A single stage.",
          "Zeros splitting the row into independent pieces.",
          "An odd number of negatives in a piece: the best run drops one end.",
        ],
        commonMistakes: [
          "Updating high first and then computing low from the new high.",
          "Tracking only the maximum, as for sums, which misses negative × negative.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "largest-solar-square",
    title: "Largest Square Solar Panel",
    difficulty: "MEDIUM",
    learningObjective:
      "Store, for each cell, the size of the best square that ends there, and grow it from its three neighbours.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "An installer surveys a flat roof divided into equal tiles. A 1 marks a tile that can hold a panel; a 0 marks a vent, skylight or chimney. Panels are sold only as squares, and a panel must sit entirely on usable tiles."
      ),
      para(
        "Return the area, in tiles, of the largest square panel that fits. If no tile is usable, return 0."
      ),
      example(
        "roof = [[1, 1, 1, 0], [1, 1, 1, 1], [1, 1, 1, 1], [0, 1, 1, 1]]",
        "9",
        [
          { state: "row 0: 1 1 1 0", note: "squares of side 1" },
          { state: "row 1: 1 2 2 1", note: "2 = 1 + min(up, left, up-left)" },
          { state: "row 2: 1 2 3 2", note: "a 3 × 3 square ends at (2, 2)" },
          { state: "row 3: 0 1 2 3", note: "another 3 × 3 ends at (3, 3)" },
          { state: "largest side 3", note: "area 9" },
        ],
        "Side of the largest square ending at each tile"
      ),
    ],
    constraints: ["1 ≤ rows, cols ≤ 200", "roof[r][c] is 0 or 1"],
    signature: {
      params: ["int[][]"],
      paramNames: ["roof"],
      returns: "int",
      functionName: "largestPanelArea",
    },
    tests: [
      {
        input: "4\n1 1 1 0\n1 1 1 1\n1 1 1 1\n0 1 1 1",
        expected: "9",
        isSample: true,
        explanation: "Rows 0-2, columns 0-2 form a 3 × 3 block of usable tiles.",
      },
      {
        input: "2\n0 1\n1 0",
        expected: "1",
        isSample: true,
        explanation: "No 2 × 2 block is fully usable, so the best panel is one tile.",
      },
      { input: "1\n0", expected: "0" },
      { input: "1\n1", expected: "1" },
      { input: "2\n1 1\n1 1", expected: "4" },
      { input: "2\n0 0 0\n0 0 0", expected: "0" },
      { input: "1\n1 1 1 1 1", expected: "1" },
      { input: "4\n1 0 1 1\n1 1 1 1\n0 1 1 1\n1 1 0 1", expected: "4" },
      {
        input:
          "40\n1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 1 1 1 1 0 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 0 1\n1 0 1 1 0 1 1 1 0 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 0 1 1\n1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 0 1 1 1 0 1 1 1 0 1 0 1 1 0 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1\n1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0\n1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0\n1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1\n1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 1 1 1 1 0 1 1 1 1 1 0 1 0 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n1 1 1 0 1 1 1 1 0 0 1 0 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 0 1 1 1 1 1\n0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 0 1 0 1 1 1 0 1\n1 0 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 0 1 0 1 1 1 0 1 1 1 1 0 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 0 1 1\n1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1\n1 1 1 1 1 1 0 1 0 1 1 0 1 1 0 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 0 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1\n1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1\n1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 0 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1",
        expected: "81",
      },
    ],
    hints: [
      "Pick a usable tile and treat it as the bottom-right corner of a square. What limits how big that square can be?",
      "The squares ending at the tile above, the tile to the left and the tile diagonally up-left.",
      "side(r, c) = 1 + min(side(r - 1, c), side(r, c - 1), side(r - 1, c - 1)) for a usable tile, else 0.",
      "Pad the table with an extra zero row and column so the border needs no special case. Remember to return the area, not the side.",
    ],
    solutions: [
      {
        title: "Brute force: grow a square from every corner",
        order: 1,
        intuition:
          "Try every tile as a top-left corner and keep enlarging the square while every tile inside it is usable. Each check rescans the whole square, so large clear roofs are very slow.",
        approach: [
          "For each tile (r, c), start with side k = 1.",
          "While the k × k square fits on the roof and every tile in it is 1, record k² and try k + 1.",
          "Return the largest area recorded.",
        ],
        code: {
          PYTHON: `def largestPanelArea(roof: List[List[int]]) -> int:
    rows, cols = len(roof), len(roof[0])
    best = 0

    def all_usable(r: int, c: int, k: int) -> bool:
        for i in range(r, r + k):
            for j in range(c, c + k):
                if roof[i][j] == 0:
                    return False
        return True

    for r in range(rows):
        for c in range(cols):
            k = 1
            while r + k <= rows and c + k <= cols and all_usable(r, c, k):
                best = max(best, k * k)
                k += 1

    return best`,
          JAVA: `class Solution {
    public int largestPanelArea(int[][] roof) {
        int rows = roof.length, cols = roof[0].length, best = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int k = 1;
                while (r + k <= rows && c + k <= cols && allUsable(roof, r, c, k)) {
                    best = Math.max(best, k * k);
                    k++;
                }
            }
        }
        return best;
    }

    private boolean allUsable(int[][] roof, int r, int c, int k) {
        for (int i = r; i < r + k; i++)
            for (int j = c; j < c + k; j++)
                if (roof[i][j] == 0) return false;
        return true;
    }
}`,
        },
        timeComplexity: "O(rows × cols × min(rows, cols)³) in the worst case",
        spaceComplexity: "O(1)",
        edgeCases: ["A roof with no usable tile returns 0."],
        commonMistakes: ["Returning the side length instead of the area."],
      },
      {
        title: "Optimal: square size ending at each tile",
        order: 2,
        intuition:
          "A square of side k ends at (r, c) exactly when squares of side k − 1 end at the tile above, the tile to the left and the tile up-left, and (r, c) itself is usable. So the largest side at (r, c) is one more than the smallest of those three. Filling in reading order means all three are known in time.",
        approach: [
          "Create side with one extra row and column of zeros.",
          "For each usable tile, side[r][c] = 1 + min(up, left, up-left) in padded coordinates.",
          "Track the largest side seen.",
          "Return largest × largest.",
        ],
        code: {
          PYTHON: `def largestPanelArea(roof: List[List[int]]) -> int:
    rows, cols = len(roof), len(roof[0])
    # side[r][c]: largest square whose bottom-right tile is roof[r - 1][c - 1]
    side = [[0] * (cols + 1) for _ in range(rows + 1)]
    best = 0

    for r in range(1, rows + 1):
        for c in range(1, cols + 1):
            if roof[r - 1][c - 1] == 1:
                side[r][c] = 1 + min(side[r - 1][c], side[r][c - 1], side[r - 1][c - 1])
                best = max(best, side[r][c])

    return best * best`,
          JAVA: `class Solution {
    public int largestPanelArea(int[][] roof) {
        int rows = roof.length, cols = roof[0].length;
        int[][] side = new int[rows + 1][cols + 1];
        int best = 0;

        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= cols; c++) {
                if (roof[r - 1][c - 1] == 1) {
                    side[r][c] = 1 + Math.min(side[r - 1][c], Math.min(side[r][c - 1], side[r - 1][c - 1]));
                    best = Math.max(best, side[r][c]);
                }
            }
        }

        return best * best;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity:
          "O(rows × cols); one row plus a saved diagonal is enough if memory matters",
        edgeCases: [
          "A single tile, usable or not.",
          "A long thin roof, where the answer is at most 1.",
          "Two overlapping large squares.",
        ],
        commonMistakes: [
          "Using only the up and left neighbours, which accepts an L shape with a missing corner.",
          "Returning the side instead of the area.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(rows × cols)",
  },

  {
    slug: "longest-mirror-subsequence",
    title: "Longest Mirror Necklace",
    difficulty: "MEDIUM",
    learningObjective:
      "Solve an interval DP over a string, filling shorter spans before the longer spans that contain them.",
    topics: ["dynamic-programming", "strings"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A jeweller has a strand of lettered beads and wants to remove some of them so that what remains reads the same from either end. She may remove any beads, but cannot reorder the ones she keeps."
      ),
      para(
        "Return the largest number of beads she can keep. Unlike finding a mirrored stretch of adjacent beads, the kept beads here need not be next to each other on the original strand."
      ),
      example(
        'beads = "character"',
        "5",
        [
          { state: "ends c … c (positions 0 and 5)", note: "keep both: +2" },
          { state: "inside: h a r a", note: "a … a match: +2" },
          { state: "inside: r", note: "a single bead: +1" },
          { state: "kept: c a r a c", note: "length 5" },
        ],
        "Matching beads from the outside in"
      ),
    ],
    constraints: [
      "0 ≤ beads.length ≤ 1000",
      "beads contains lowercase English letters only.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["beads"],
      returns: "int",
      functionName: "longestMirror",
    },
    tests: [
      {
        input: "character",
        expected: "5",
        isSample: true,
        explanation: "Keep c, a, r, a, c.",
      },
      {
        input: "abcd",
        expected: "1",
        isSample: true,
        explanation: "All beads differ, so only one can be kept.",
      },
      { input: "", expected: "0" },
      { input: "z", expected: "1" },
      { input: "aaaa", expected: "4" },
      { input: "ab", expected: "1" },
      { input: "racecar", expected: "7" },
      { input: "bbbab", expected: "4" },
      { input: "agbdba", expected: "5" },
      {
        input:
          "aeddbaadebbddedacecbabacbbcbbcdbeedddddceeeabdccaacdacaaaabcdcdedaadbddaebacccddcabdabeccadcbbabcdaddcbbdaeeacebadaccbaaaddedeeeddcacebdbabbdcddabbcdddbdccddeaaaebcccdbaceaeabaaabbcceacbeecceceebaebedeecceeeadecbaaedaadeedbecdcbddceddcaeadbbdddccbddaacbcdeabccdaecabaaecebaccbcbccbbedabdecebeaceecbbddeaacebbcecddbceaaebceebeaedcddebaccdadcdacdbcbdedaececbdebededdedcbcbddeeacaeeddbdeaedeadbedaedacbacecbbdbbcbbbcceecaaedbbcbddceabebceaebdbdeeeabbaeadeadcecbaedbbaddbcdecacddebdbcbecabcacbedddabaeceadaccdeabbdbcebaacbdcdcdbbaeeccceeccbbaabdbabbeddceeadbdedcedacdaeeecbeaeaceaaeeabebcebcaadcedbcebdcc",
        expected: "359",
      },
    ],
    hints: [
      "Look at the first and last bead of a span. If they match, what can you do with them?",
      "Keep both and solve the inside. If they do not match, at least one of them is removed: try dropping each.",
      "Let L(i, j) be the answer for beads[i..j]. It depends on L(i + 1, j - 1), L(i + 1, j) and L(i, j - 1).",
      "Fill the table so shorter spans are done first: i from the right end down to 0, and j from i upward.",
    ],
    solutions: [
      {
        title: "Brute force: match or drop the ends",
        order: 1,
        intuition:
          "Matching end beads can always both be kept around the best inner answer. Mismatched ends cannot both be kept, so try dropping either one. The recursion is right but the same inner spans are reached along many different paths.",
        approach: [
          "Empty span: 0. A single bead: 1.",
          "Matching ends: 2 + the answer for the inside.",
          "Otherwise: the larger of dropping the left bead or dropping the right bead.",
        ],
        code: {
          PYTHON: `def longestMirror(beads: str) -> int:
    def solve(i: int, j: int) -> int:
        if i > j:
            return 0
        if i == j:
            return 1
        if beads[i] == beads[j]:
            return 2 + solve(i + 1, j - 1)
        return max(solve(i + 1, j), solve(i, j - 1))

    return solve(0, len(beads) - 1)`,
          JAVA: `class Solution {
    private String beads;

    public int longestMirror(String beads) {
        this.beads = beads;
        return solve(0, beads.length() - 1);
    }

    private int solve(int i, int j) {
        if (i > j) return 0;
        if (i == j) return 1;
        if (beads.charAt(i) == beads.charAt(j)) return 2 + solve(i + 1, j - 1);
        return Math.max(solve(i + 1, j), solve(i, j - 1));
    }
}`,
        },
        timeComplexity: "O(2ⁿ) in the worst case",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["An empty strand, which keeps 0 beads."],
        commonMistakes: [
          "Forgetting the single-bead base case, so a lone middle bead is lost.",
        ],
      },
      {
        title: "Optimal: table over spans",
        order: 2,
        intuition:
          "There are only n² spans (i, j), and each one's answer comes from spans strictly inside it. Iterating i from the right end leftwards and j from i rightwards guarantees that the row below (i + 1) and the entry to the left (j − 1) are already filled.",
        approach: [
          "Create an n × n table of zeros.",
          "For i from n − 1 down to 0: set span[i][i] = 1.",
          "For j from i + 1 to n − 1: on matching ends, span[i][j] = span[i + 1][j − 1] + 2; otherwise the max of span[i + 1][j] and span[i][j − 1].",
          "Return span[0][n − 1], or 0 for an empty strand.",
        ],
        code: {
          PYTHON: `def longestMirror(beads: str) -> int:
    n = len(beads)
    if n == 0:
        return 0
    # span[i][j] = most beads kept from beads[i..j] as a mirror
    span = [[0] * n for _ in range(n)]

    for i in range(n - 1, -1, -1):
        span[i][i] = 1
        for j in range(i + 1, n):
            if beads[i] == beads[j]:
                span[i][j] = span[i + 1][j - 1] + 2  # keep both ends
            else:
                span[i][j] = max(span[i + 1][j], span[i][j - 1])  # drop one end

    return span[0][n - 1]`,
          JAVA: `class Solution {
    public int longestMirror(String beads) {
        int n = beads.length();
        if (n == 0) return 0;
        int[][] span = new int[n][n];

        for (int i = n - 1; i >= 0; i--) {
            span[i][i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (beads.charAt(i) == beads.charAt(j)) {
                    span[i][j] = span[i + 1][j - 1] + 2;
                } else {
                    span[i][j] = Math.max(span[i + 1][j], span[i][j - 1]);
                }
            }
        }

        return span[0][n - 1];
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n²); a single row is enough with a saved diagonal",
        edgeCases: [
          "Adjacent matching beads (j = i + 1): the inside is empty and contributes 0.",
          "A strand that is already a mirror: every bead is kept.",
          "All beads different: 1.",
        ],
        commonMistakes: [
          "Filling i from 0 upward, so span[i + 1][…] is read before it is computed.",
          "Confusing this with the longest mirrored stretch of adjacent beads, which is a different problem.",
        ],
      },
    ],
    expectedTime: "O(n²)",
    expectedSpace: "O(n²)",
  },

  {
    slug: "pack-the-rucksack",
    title: "Pack the Rucksack",
    difficulty: "MEDIUM",
    learningObjective:
      "Solve 0/1 knapsack with a capacity-indexed table, sweeping capacity downward so each item is used at most once.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A hiker is packing for a long trail. Each piece of kit has a weight and a usefulness score, and there is only one of each. The rucksack can carry at most a fixed total weight."
      ),
      rich(
        "Given ",
        { code: "weights" },
        " and ",
        { code: "values" },
        " (item i weighs weights[i] and is worth values[i]) and the ",
        { code: "capacity" },
        ", return the highest total value of items that fit together within the capacity."
      ),
      example(
        "weights = [1, 3, 4, 5], values = [15, 50, 60, 90], capacity = 7",
        "110",
        [
          { state: "after item 0: best[1..7] = 15", note: "only the light item" },
          { state: "after item 1: best[4..7] = 65", note: "items 0 and 1" },
          {
            state: "after item 2: best[7] = best[3] + 60 = 110",
            note: "items 1 and 2: weight 7",
          },
          { state: "after item 3: best[7] stays 110", note: "5 + 1 gives only 105" },
        ],
        "Best value for each capacity as items are considered"
      ),
    ],
    constraints: [
      "1 ≤ weights.length = values.length ≤ 100",
      "1 ≤ weights[i] ≤ 1000",
      "1 ≤ values[i] ≤ 1000",
      "0 ≤ capacity ≤ 1000",
    ],
    signature: {
      params: ["int[]", "int[]", "int"],
      paramNames: ["weights", "values", "capacity"],
      returns: "int",
      functionName: "bestPackValue",
    },
    tests: [
      {
        input: "1 3 4 5\n15 50 60 90\n7",
        expected: "110",
        isSample: true,
        explanation: "The items weighing 3 and 4 fit exactly, worth 50 + 60.",
      },
      {
        input: "5 6\n10 20\n4",
        expected: "0",
        isSample: true,
        explanation: "Both items are heavier than the capacity.",
      },
      { input: "2\n7\n2", expected: "7" },
      { input: "1 1 1\n5 5 5\n0", expected: "0" },
      { input: "4 2 3\n10 4 7\n5", expected: "11" },
      { input: "3 3 3 3\n5 6 7 8\n9", expected: "21" },
      { input: "10 20 30\n60 100 120\n50", expected: "220" },
      {
        input:
          "2 2 52 27 56 3 54 20 39 3 30 9 45 30 32 25 38 49 52 51 26 36 14 57 38 7 44 30 5 43 37 8 55 58 41 8 23 31 11 14 4 18 51 29 5 30 54 17 28 42 16 21 55 10 18 52 39 51 20 23 17 17 53 1 28 34 14 31 47 44 17 2 12 59 8 28 18 18 42 29 56 34 48 32 3 36 1 22 33 34 24 3 54 41 18 46 18 3 45 16\n460 377 442 320 389 155 462 358 106 99 117 80 272 417 303 443 283 285 238 365 172 480 162 390 470 339 228 391 113 376 107 433 99 412 370 351 274 15 350 42 270 137 317 37 265 144 120 349 89 392 125 488 346 390 61 42 157 37 29 410 254 197 193 395 292 44 364 208 2 385 220 450 57 91 143 462 244 431 284 492 300 274 259 67 293 129 33 171 312 219 104 294 482 205 42 358 167 452 471 189\n1000",
        expected: "17069",
      },
    ],
    hints: [
      "Packing the most valuable items first, or the best value-per-weight first, both fail on some inputs. Try to find one.",
      "For each item there are two choices: leave it, or pack it and lose its weight from the remaining capacity.",
      "best(i, c) = max(best(i - 1, c), best(i - 1, c - w) + v). Only the previous item's row is needed.",
      "With one array indexed by capacity, sweep capacity from high to low so an item is not packed twice.",
    ],
    solutions: [
      {
        title: "Brute force: pack or leave each item",
        order: 1,
        intuition:
          "Every packing is a yes/no decision per item. Recursing over items and remaining capacity tries all 2ⁿ of them, keeping the best that fits.",
        approach: [
          "Recurse with an item index and the remaining capacity.",
          "Past the last item, the value is 0.",
          "Leaving the item is always possible; packing it is possible only if it fits.",
          "Return the better of the two.",
        ],
        code: {
          PYTHON: `def bestPackValue(weights: List[int], values: List[int], capacity: int) -> int:
    def best(i: int, room: int) -> int:
        if i == len(weights):
            return 0
        leave = best(i + 1, room)
        if weights[i] > room:
            return leave
        pack = values[i] + best(i + 1, room - weights[i])
        return max(leave, pack)

    return best(0, capacity)`,
          JAVA: `class Solution {
    private int[] weights, values;

    public int bestPackValue(int[] weights, int[] values, int capacity) {
        this.weights = weights;
        this.values = values;
        return best(0, capacity);
    }

    private int best(int i, int room) {
        if (i == weights.length) return 0;
        int leave = best(i + 1, room);
        if (weights[i] > room) return leave;
        return Math.max(leave, values[i] + best(i + 1, room - weights[i]));
    }
}`,
        },
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["A capacity of 0, which packs nothing."],
        commonMistakes: [
          "Packing an item that does not fit and letting the remaining room go negative.",
        ],
      },
      {
        title: "Optimal: best value per capacity",
        order: 2,
        intuition:
          "After considering some of the items, all that matters for the future is how much room is left. So store best[c], the most value achievable within weight c using the items seen so far. Adding an item (w, v) offers best[c − w] + v for every c ≥ w. Sweeping c downward reads best[c − w] before this item has touched it, which is what keeps each item to a single use.",
        approach: [
          "best has capacity + 1 zeros.",
          "For each item (w, v), for c from capacity down to w: best[c] = max(best[c], best[c − w] + v).",
          "Return best[capacity].",
        ],
        code: {
          PYTHON: `def bestPackValue(weights: List[int], values: List[int], capacity: int) -> int:
    # best[c] = most value that fits within weight c, using items seen so far
    best = [0] * (capacity + 1)

    for w, v in zip(weights, values):
        for c in range(capacity, w - 1, -1):  # downward: each item once
            best[c] = max(best[c], best[c - w] + v)

    return best[capacity]`,
          JAVA: `class Solution {
    public int bestPackValue(int[] weights, int[] values, int capacity) {
        int[] best = new int[capacity + 1];

        for (int i = 0; i < weights.length; i++) {
            int w = weights[i], v = values[i];
            for (int c = capacity; c >= w; c--) {
                best[c] = Math.max(best[c], best[c - w] + v);
            }
        }

        return best[capacity];
    }
}`,
        },
        timeComplexity: "O(n × capacity)",
        spaceComplexity: "O(capacity)",
        edgeCases: [
          "No item fits: 0.",
          "Capacity 0: 0.",
          "Several equal-weight items, where only the most valuable few fit.",
        ],
        commonMistakes: [
          "Sweeping capacity upward, which silently allows unlimited copies of each item.",
          "Choosing items greedily by value or by value per unit weight.",
        ],
      },
    ],
    expectedTime: "O(n × capacity)",
    expectedSpace: "O(capacity)",
  },

  {
    slug: "min-edit-steps",
    title: "Fewest Keystroke Fixes",
    difficulty: "HARD",
    learningObjective:
      "Build the edit distance table from three operations, reading each cell from its left, upper and diagonal neighbours.",
    topics: ["dynamic-programming", "strings"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "An autocorrect feature ranks suggestions by how many keystroke fixes separate a typed word from a dictionary word. One fix is inserting a character, deleting a character, or replacing one character with another."
      ),
      para("Return the fewest fixes that turn source into target."),
      example(
        'source = "flask", target = "flock"',
        "2",
        [
          { state: "f = f, l = l", note: "no cost" },
          { state: "a → o", note: "replace: 1" },
          { state: "s → c", note: "replace: 2" },
          { state: "k = k", note: "total 2" },
        ],
        "Aligning the two words"
      ),
    ],
    constraints: [
      "0 ≤ source.length, target.length ≤ 500",
      "Both strings contain lowercase English letters only.",
    ],
    signature: {
      params: ["string", "string"],
      paramNames: ["source", "target"],
      returns: "int",
      functionName: "minEdits",
    },
    tests: [
      {
        input: "flask\nflock",
        expected: "2",
        isSample: true,
        explanation: "Replace a with o and s with c.",
      },
      {
        input: "ruby\nrub",
        expected: "1",
        isSample: true,
        explanation: "Delete the final y.",
      },
      {
        input: "\nink",
        expected: "3",
        isSample: true,
        explanation: "Insert all three characters.",
      },
      { input: "same\nsame", expected: "0" },
      { input: "abc\n", expected: "3" },
      { input: "intention\nexecution", expected: "5" },
      { input: "kitten\nsitting", expected: "3" },
      { input: "a\nb", expected: "1" },
      {
        input:
          "ababbcbdcbadcbbbaddaccdaabcabcdcadbbcaccccadcacdcaddddbcaabbbcbacaacdbbdbaccbcdcbcdddcdcdccdacabbacbaacddacbcccadcbbaccbddcbcdcbbdbccabcacdbbabdabcabcbdbcaccaadbacaccdcdcbbcbbacbbbadbdaacacbbcdcaaccdbadbcaadbacbcdadcdbbbbdbdacacbabbabddcccccdaaacdccdacabbdcdadaadddcdcadacbabccdbcbdbccbbbbbcbdccadbdacaacbdcacbdbdabdaccbcccddaacdcaadddaadadcccbbdbccdddadcacabbdadcdaacaacbcdbbcbbdccbccabaddddcdcaaabb\ndcbbbbdddbaccadcacbdaddbaadbaabcdaddaadabccbaabdbcaadaddbadacddabdbadcabdcaadabbbcccbcbbaadcdcbbacddccabddbcabcadbdcacddbdbccadcacbdddcbbdccbccadcaddaadbcccacdddccaabaabbcddddabaaabcdabccbaccdaccdacbbaabcdbdddcdadcddcbdbbaadacdcabbdadcbbcccaddadabcbcdbdccababcbbcaacdbdbbcdccbadbacabddcbcccbaaadcbbaabcdbaaabcccadccadabcbdadacddcabbddbadbadacbbbcbcdbcbbbbcaadbddbcbdacdcdcaadbbabddbabbcabdbbdbbdacbcb",
        expected: "213",
      },
    ],
    hints: [
      "Compare the last characters of the two words. If they match, is any fix needed for them?",
      "If they differ, the last fix touching them was one of: replace one with the other, delete from source, or insert into target. Each leaves a smaller pair of prefixes.",
      "D(i, j) = D(i − 1, j − 1) on a match, else 1 + min(D(i − 1, j − 1), D(i − 1, j), D(i, j − 1)).",
      "Base cases: turning a prefix into the empty string takes one delete per character, and the reverse takes one insert per character.",
    ],
    solutions: [
      {
        title: "Brute force: try all three fixes",
        order: 1,
        intuition:
          "Walk both words from the front. Matching characters cost nothing; on a mismatch, try replace, delete and insert and keep the cheapest. Each mismatch branches three ways, so the cost explodes even for medium words.",
        approach: [
          "If source is used up, insert the rest of target; if target is used up, delete the rest of source.",
          "On matching characters, advance both.",
          "Otherwise 1 + the minimum of replace (advance both), delete (advance source) and insert (advance target).",
        ],
        code: {
          PYTHON: `def minEdits(source: str, target: str) -> int:
    def fixes(i: int, j: int) -> int:
        if i == len(source):
            return len(target) - j  # insert what is left
        if j == len(target):
            return len(source) - i  # delete what is left
        if source[i] == target[j]:
            return fixes(i + 1, j + 1)
        return 1 + min(
            fixes(i + 1, j + 1),  # replace
            fixes(i + 1, j),      # delete from source
            fixes(i, j + 1),      # insert into source
        )

    return fixes(0, 0)`,
          JAVA: `class Solution {
    private String source, target;

    public int minEdits(String source, String target) {
        this.source = source;
        this.target = target;
        return fixes(0, 0);
    }

    private int fixes(int i, int j) {
        if (i == source.length()) return target.length() - j;
        if (j == target.length()) return source.length() - i;
        if (source.charAt(i) == target.charAt(j)) return fixes(i + 1, j + 1);
        return 1 + Math.min(fixes(i + 1, j + 1), Math.min(fixes(i + 1, j), fixes(i, j + 1)));
    }
}`,
        },
        timeComplexity: "O(3^(m + n)) in the worst case",
        spaceComplexity: "O(m + n) recursion depth",
        edgeCases: ["One word empty: the answer is the other word's length."],
        commonMistakes: ["Charging 1 for matching characters."],
      },
      {
        title: "Optimal: prefix table, two rows",
        order: 2,
        intuition:
          "Let D(i, j) be the fixes needed to turn the first i characters of source into the first j of target. The last characters either match (free, look diagonally) or one of the three fixes was applied last: replace (diagonal), delete (above) or insert (left). Each row only reads the previous row and the cell to its left, so two arrays suffice.",
        approach: [
          "prev = [0, 1, …, n]: building target[:j] from nothing takes j inserts.",
          "For each i, start cur with i: turning source[:i] into nothing takes i deletes.",
          "Fill cur[j] from prev[j − 1], prev[j] and cur[j − 1].",
          "Swap rows; return prev[n] at the end.",
        ],
        code: {
          PYTHON: `def minEdits(source: str, target: str) -> int:
    n = len(target)
    prev = list(range(n + 1))  # "" -> target[:j] takes j inserts

    for i in range(1, len(source) + 1):
        cur = [i] + [0] * n  # source[:i] -> "" takes i deletes
        for j in range(1, n + 1):
            if source[i - 1] == target[j - 1]:
                cur[j] = prev[j - 1]  # free: characters already agree
            else:
                cur[j] = 1 + min(
                    prev[j - 1],  # replace
                    prev[j],      # delete source[i - 1]
                    cur[j - 1],   # insert target[j - 1]
                )
        prev = cur

    return prev[n]`,
          JAVA: `class Solution {
    public int minEdits(String source, String target) {
        int n = target.length();
        int[] prev = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;

        for (int i = 1; i <= source.length(); i++) {
            int[] cur = new int[n + 1];
            cur[0] = i;
            for (int j = 1; j <= n; j++) {
                if (source.charAt(i - 1) == target.charAt(j - 1)) {
                    cur[j] = prev[j - 1];
                } else {
                    cur[j] = 1 + Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1]));
                }
            }
            prev = cur;
        }

        return prev[n];
    }
}`,
        },
        timeComplexity: "O(m × n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "source empty: n inserts. target empty: m deletes.",
          "Identical words: 0.",
          "Words with no letters in common: max(m, n).",
        ],
        commonMistakes: [
          "Leaving the first column at 0 instead of i, which makes deletions free.",
          "Adding 1 on a match.",
          "Mixing up which neighbour means insert and which means delete; it does not change the answer, but it matters if you reconstruct the edits.",
        ],
      },
    ],
    expectedTime: "O(m × n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "interleaved-streams",
    title: "Merged Chat Streams",
    difficulty: "HARD",
    learningObjective:
      "Decide a two-string merge question with a table over prefix pairs, where the merged position is fixed by the two prefix lengths.",
    topics: ["dynamic-programming", "strings"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A chat server receives keystrokes from two clients and writes them into one log as they arrive. Each client's keystrokes stay in their own order, but the two streams can be woven together in any way."
      ),
      para(
        "Given the two client streams and the server log, return true if the log could have been produced by interleaving the two streams: every character of both streams appears exactly once, and each stream's characters keep their relative order."
      ),
      example(
        'first = "abc", second = "xbz", merged = "axbbcz"',
        "true",
        [
          { state: "a ← first", note: "first: a|bc" },
          { state: "x ← second, b ← second", note: "second: xb|z" },
          { state: "b ← first, c ← first", note: "first finished" },
          { state: "z ← second", note: "both streams used up exactly" },
        ],
        "One way to weave the streams"
      ),
    ],
    constraints: [
      "0 ≤ first.length, second.length ≤ 300",
      "0 ≤ merged.length ≤ 600",
      "All strings contain lowercase English letters only.",
    ],
    signature: {
      params: ["string", "string", "string"],
      paramNames: ["first", "second", "merged"],
      returns: "bool",
      functionName: "isInterleaving",
    },
    tests: [
      {
        input: "abc\nxbz\naxbbcz",
        expected: "true",
        isSample: true,
        explanation:
          "a from first, x and b from second, b and c from first, z from second.",
      },
      {
        input: "ab\nca\naabc",
        expected: "false",
        isSample: true,
        explanation:
          "Second must give c before its a, but merged needs two a's before any c, and first has only one.",
      },
      { input: "\n\n", expected: "true" },
      { input: "a\n\na", expected: "true" },
      { input: "\nb\nc", expected: "false" },
      { input: "ab\nab\nabab", expected: "true" },
      { input: "abc\ndef\nabcdefx", expected: "false" },
      { input: "aabcc\ndbbca\naadbbcbcac", expected: "true" },
      { input: "aabcc\ndbbca\naadbbbaccc", expected: "false" },
      {
        input:
          "bbababaaaabaaaabbabaabbababaaaabbbbbaaabaaaabbabaababbbababbaaabbbabbbababbabaabaabaabaabbaabaabbaababbbbbababaaabaaaaaaabaaabbabaabbaaaababaabbaaaabbbabaaaabbabbabbbabbaaabbbabbbbaaabaaabbbabaabbaaabbbbabbabbbbabbababbabbbaaaabaabbbabbabbbbababababaababbbaabbaabbabbbbabbbbbbabbbaababaabbaabbbababbb\nbabbababbbbbbabbaaaaabaabbbaaabbbbaaaabaabaabbbaabbabaabbbbbababbaabbaaaababbaaaaabbbaabbabbabaabbaaabababbbabaabaabaabbabbaababbabbaabbbbbabbbbaababbbbbbabababbabbabaabbabaabbbbabbbbbaaaabbbbabbbabbaaabaaababaaaababaababbbaaababbbabbabaaaaabbabbababababbabbbabbbbbbaaabaaaabbabbbbabbbaaaabaaabbabbba\nbabbbabbaabbbbbabbabbbaaaabaaaaaaaababaabbabbbaaaaabbbabbbbaaabaaaaabaaabbaabbbbbaaabbbaaabaaababbbaaabbbbaabbbababbabbbaaabbabbabaaabaaababbbababaaababbbbaaababbbbaabaabbbaaabaabaabaabbbbaaaababaaababbbbbaabababaabbbbaabbababaaabaababbbaaabaaaaabbaaabbbaaaabbaabbbbbaabbbabbaababaaababaabbbaabbaababbbbbabbaabbabbaabaabaabbbaaabbbabbaababbbabbbabbbbbbbaaaabaabbababbbabbbbbaabbaabbabaabaaaabbaaababbaabaaaabbaaababaabbabbbbababaababbabbbbbbabbbababbaabbbbaaaabbaabaabbaaaababbbabbbbabababbababbaabaababbbabbaaabbbaabbabbabbbabbbbbabbbbbbbbabaabbabbbaaaabaaabbbabbbbaaabbbbbaaaaababbbaabaaabbabbbbabb",
        expected: "true",
      },
      {
        input:
          "bbababaaaabaaaabbabaabbababaaaabbbbbaaabaaaabbabaababbbababbaaabbbabbbababbabaabaabaabaabbaabaabbaababbbbbababaaabaaaaaaabaaabbabaabbaaaababaabbaaaabbbabaaaabbabbabbbabbaaabbbabbbbaaabaaabbbabaabbaaabbbbabbabbbbabbababbabbbaaaabaabbbabbabbbbababababaababbbaabbaabbabbbbabbbbbbabbbaababaabbaabbbababbb\nbabbababbbbbbabbaaaaabaabbbaaabbbbaaaabaabaabbbaabbabaabbbbbababbaabbaaaababbaaaaabbbaabbabbabaabbaaabababbbabaabaabaabbabbaababbabbaabbbbbabbbbaababbbbbbabababbabbabaabbabaabbbbabbbbbaaaabbbbabbbabbaaabaaababaaaababaababbbaaababbbabbabaaaaabbabbababababbabbbabbbbbbaaabaaaabbabbbbabbbaaaabaaabbabbba\nbabbbabbaabbbbbabbabbbaaaabaaaaaaaababaabbabbbaaaaabbbabbbbaaabaaaaabaaabbaabbbbbaaabbbaaabaaababbbaaabbbbaabbbababbabbbaaabbabbabaaabaaababbbababaaababbbbaaababbbbaabaabbbaaabaabaabaabbbbaaaababaaababbbbbaababbaaabbbbaabbababaaabaababbbaaabaaaaabbaaabbbaaaabbaabbbbbaabbbabbaababaaababaabbbaabbaababbbbbabbaabbabbaabaabaabbbaaabbbabbaababbbabbbabbbbbbbaaaabaabbababbbabbbbbaabbaabbabaabaaaabbaaababbaabaaaabbaaababaabbabbbbababaababbabbbbbbabbbababbaabbbbaaaabbaabaabbaaaababbbabbbbabababbababbaabaababbbabbaaabbbaabbabbabbbabbbbbabbbbbbbbabaabbabbbaaaabaaabbbabbbbaaabbbbbaaaaababbbaabaaabbabbbbabb",
        expected: "false",
      },
    ],
    hints: [
      "If the lengths do not add up, the answer is immediately false.",
      "After using i characters of first and j of second, you are at position i + j of merged. The state is just the pair (i, j).",
      "ok(i, j) is true if (first[i − 1] matches merged[i + j − 1] and ok(i − 1, j)) or (second[j − 1] matches it and ok(i, j − 1)).",
      "Fill row by row; a single array of length len(second) + 1 is enough.",
    ],
    solutions: [
      {
        title: "Brute force: take the next character from either stream",
        order: 1,
        intuition:
          "At each position of the log, the character must come from the front of one of the streams. Try whichever fronts match and recurse. When both match, both branches are explored, and repeated characters make this exponential.",
        approach: [
          "Return false at once if the lengths do not add up.",
          "Recurse on (i, j); when i + j reaches the end of merged, return true.",
          "Try first[i] if it matches merged[i + j], then second[j] if it matches.",
        ],
        code: {
          PYTHON: `def isInterleaving(first: str, second: str, merged: str) -> bool:
    if len(first) + len(second) != len(merged):
        return False

    def weave(i: int, j: int) -> bool:
        k = i + j
        if k == len(merged):
            return True
        if i < len(first) and first[i] == merged[k] and weave(i + 1, j):
            return True
        return j < len(second) and second[j] == merged[k] and weave(i, j + 1)

    return weave(0, 0)`,
          JAVA: `class Solution {
    private String first, second, merged;

    public boolean isInterleaving(String first, String second, String merged) {
        if (first.length() + second.length() != merged.length()) return false;
        this.first = first;
        this.second = second;
        this.merged = merged;
        return weave(0, 0);
    }

    private boolean weave(int i, int j) {
        int k = i + j;
        if (k == merged.length()) return true;
        if (i < first.length() && first.charAt(i) == merged.charAt(k) && weave(i + 1, j)) return true;
        return j < second.length() && second.charAt(j) == merged.charAt(k) && weave(i, j + 1);
    }
}`,
        },
        timeComplexity: "O(2^(m + n)) in the worst case",
        spaceComplexity: "O(m + n) recursion depth",
        edgeCases: ["All three strings empty: true."],
        commonMistakes: [
          "Greedily taking from first whenever it matches, which fails when both streams share a character.",
        ],
      },
      {
        title: "Optimal: reachable prefix pairs",
        order: 2,
        intuition:
          "A partial weave is fully described by how many characters it has taken from each stream, (i, j), and the position in the log is always i + j. So there are only (m + 1)(n + 1) states. A state is reachable if the previous character came from first (state (i − 1, j)) or from second (state (i, j − 1)) and that character matches the log. Rows only look at the row above and the cell to the left, so one array holds it all.",
        approach: [
          "If len(first) + len(second) ≠ len(merged), return false.",
          "ok has len(second) + 1 entries.",
          "For each i from 0 to m and j from 0 to n: (0, 0) is true. Otherwise ok[j] (still the value for row i − 1) counts if first[i − 1] matches merged[i + j − 1], and ok[j − 1] (already this row) counts if second[j − 1] matches.",
          "Return ok[n].",
        ],
        code: {
          PYTHON: `def isInterleaving(first: str, second: str, merged: str) -> bool:
    m, n = len(first), len(second)
    if m + n != len(merged):
        return False

    # ok[j]: merged[:i + j] weaves first[:i] with second[:j]
    ok = [False] * (n + 1)

    for i in range(m + 1):
        for j in range(n + 1):
            if i == 0 and j == 0:
                ok[j] = True
                continue
            k = i + j - 1  # the character placed last
            from_first = i > 0 and ok[j] and first[i - 1] == merged[k]
            from_second = j > 0 and ok[j - 1] and second[j - 1] == merged[k]
            ok[j] = from_first or from_second

    return ok[n]`,
          JAVA: `class Solution {
    public boolean isInterleaving(String first, String second, String merged) {
        int m = first.length(), n = second.length();
        if (m + n != merged.length()) return false;

        boolean[] ok = new boolean[n + 1];

        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                if (i == 0 && j == 0) {
                    ok[j] = true;
                    continue;
                }
                int k = i + j - 1;
                boolean fromFirst = i > 0 && ok[j] && first.charAt(i - 1) == merged.charAt(k);
                boolean fromSecond = j > 0 && ok[j - 1] && second.charAt(j - 1) == merged.charAt(k);
                ok[j] = fromFirst || fromSecond;
            }
        }

        return ok[n];
    }
}`,
        },
        timeComplexity: "O(m × n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "One stream empty: merged must equal the other stream.",
          "Lengths that do not add up: false before any work.",
          "Both streams made of the same repeated letters, where many weaves exist.",
        ],
        commonMistakes: [
          "Only checking that merged contains the right multiset of characters, ignoring order.",
          "Forgetting the length check, so trailing extra characters in merged are accepted.",
        ],
      },
    ],
    expectedTime: "O(m × n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "trade-with-rest-day",
    title: "Trading With a Rest Day",
    difficulty: "HARD",
    learningObjective:
      "Model a process with modes as a small state machine and carry the best value for each state from day to day.",
    topics: ["dynamic-programming", "arrays"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A hobby trader follows one commodity's daily closing price. She can hold at most one unit at a time, so she must sell before buying again. Her broker also enforces a rule: on the day after any sale, she may not buy."
      ),
      para(
        "Given the prices in day order, return the largest total profit she can make with any number of buy-sell rounds. Doing nothing earns 0."
      ),
      example(
        "prices = [1, 2, 3, 0, 2]",
        "3",
        [
          { state: "day 0: buy at 1", note: "holding" },
          { state: "day 1: sell at 2", note: "profit 1" },
          { state: "day 2: rest", note: "buying is not allowed today" },
          { state: "day 3: buy at 0", note: "holding" },
          { state: "day 4: sell at 2", note: "profit 1 + 2 = 3" },
        ],
        "One best plan"
      ),
    ],
    constraints: ["0 ≤ prices.length ≤ 5000", "0 ≤ prices[i] ≤ 1000"],
    signature: {
      params: ["int[]"],
      paramNames: ["prices"],
      returns: "int",
      functionName: "maxRestProfit",
    },
    tests: [
      {
        input: "1 2 3 0 2",
        expected: "3",
        isSample: true,
        explanation: "Buy 1, sell 2, rest on day 2, buy 0, sell 2: 1 + 2 = 3.",
      },
      {
        input: "5 4 3 2",
        expected: "0",
        isSample: true,
        explanation: "Prices only fall, so the best plan is not to trade.",
      },
      { input: "", expected: "0" },
      { input: "7", expected: "0" },
      { input: "1 4", expected: "3" },
      { input: "2 1 4 5 2 9 7", expected: "10" },
      { input: "3 3 3 3", expected: "0" },
      { input: "1 5 2 8 1 9", expected: "12" },
      {
        input:
          "945 239 878 744 768 799 945 476 89 265 739 482 434 720 995 486 402 110 672 864 700 214 835 711 467 445 772 361 866 565 942 316 664 155 921 956 512 38 195 741 835 654 582 910 777 753 67 155 357 218 343 193 233 737 931 918 388 251 543 423 879 747 845 328 175 134 396 298 993 945 162 185 671 146 201 348 960 124 720 886 497 696 688 805 370 496 241 719 910 743 416 489 324 918 536 451 505 329 108 362 642 295 561 235 157 771 76 131 489 511 456 918 28 618 857 353 778 742 389 180 25 265 127 666 637 189 408 683 696 391 104 96 130 480 869 988 305 468 395 514 101 318 935 873 616 162 349 864 753 383 957 894 262 628 476 419 6 157 929 107 132 119 48 348 919 672 641 797 663 670 255 97 410 309 57 163 866 846 690 328 350 494 71 419 226 203 474 744 964 355 880 935 814 445 302 272 846 682 101 637 636 631 759 360 780 77 958 359 155 794 153 23 626 981 312 887 612 134 676 531 516 685 527 84 596 57 17 96 64 739 689 288 250 306 877 333 997 820 661 696 319 835 689 651 544 495 352 309 439 929 682 508 611 397 212 310 293 238 559 75 438 194 881 502 666 48 572 908 738 198 291 287 656 141 441 687 762 506 604 558 284 196 744 462 521 730 612 225 492 877 456 876 633 755 706 131 820 122 264 922 696 125 648 981 55 680 25 100 763 685 364 477 793 823 525 553 416 535 785 830 111 767 516 180 13 51 773 219 90 863 617 935 678 461 518 184 256 834 416 638 881 207 347 470 474 758 152 775 390 108 147 208 469 891 805 319 613 90 232 336 317 836 495 495 54 179 386 426 444 474 443 923 16 267 312 719 905 114 998 877 934 326 324 614 259 338 380 564 942 783 947 302 19 560 812 336 587 65 54 877 777 1000 398 820 762 282 352 104 815 261 377 862 553 432 915 926 361 177 349 287 345 556 807 195 934 963 910 956 729 200 92 629 764 77 681 104 196 595 101 943 865 107 446 548 534 812 5 168 259 349 855 213 570 174 555 552 862 606 276 228 621 117 162 2 610 144 189 792 874 206 730 923 403 855 173 162 997 56 454 784 763 885 724 474 145 645 832 527 641 252 596 587 141 704 243 636 699 72 753 828 184 325 523 718 35 519 105 890 365 930 276 492 993 678 988 686 475 823 441 602 454 965 761 116 382 786 873 397 180 868 92 734 736 161 470 80 602 90 561 936 762 412 570 898 470 144 871 816 270 873 919 538 486 557 677 6 431 854 380 774 383 888 923 333 750 346 883 167 351 554 40 949 483 805 270 115 324 233 326 158 393 467 850 565 143 16 729 836 322 359 584 604 528 710 338 886 546 947 685 959 907 832 823 499 613 340 306 445 310 836 29 690 67 541 654 784 386 194 723 661 735 47 318 77 420 813 648 313 178 932 813 886 215 289 699 866 256 55 878 807 840 966 368 577 399 580 898 732 919 654 961 994 840 370 676 295 518 278 859 752 636 961 282 201 115 142 930 176 997 13 341 503 427 924 218 173 7 331 765 738 510 803 394 751 713 513 267 891 214 871 486 352 9 677 877 507 69 581 861 116 960 63 303 437 78 372 357 497 681 565 398 475 641 447 431 932 605 406 264 119 123 800 587 218 32 650 406 26 998 414 502 48 899 896 674 404 982 458 97 699 808 209 554 864 467 678 343 115 237 478 594 237 878 722 542 919 995 32 859 687 596 136 446 9 526 125 314 280 573 779 837 306 93 768 879 392 527 846 637 878 429 478 520 112 954 1 401 258 10 527 744 71 64 601 96 505 32 696 694 925 148 482 694 158 172 633 869 951 123 711 569 77 118 53 555 70 720 46 618 733 773 20 859 242 651 726 151 88 436 733 83 681 998 748 402 637 38 425 507 940 977 584 999 503 897 392 326 445 141 639 477 538 598 399 845 38 773 471 486 94 348 776 26 156 347 840 375 130 234 505 774 98 672 594 421 239 262 803 730 207 350 680 967 836 988 441 99 3 675 391 270 930 685 709 426 298 409 914 268 111 698 975 857 343 723 374 527 855 165 744 28 657 717 231 242 903 526 431 40 178 200 400 540 849 530 837 574 424 738 153 409 612 327 897 751 921 93 495 495 436 118 496 553 744 456 229 496 188 585 852 506 383 84 398 469 511 637 132 613 515 182 782 533 946 573 774 255 649 362 16 573 174 39 202 800 331 666 102 55 551 692 552 610 834 105 215 998 768 998 793 550 768 625 740 733 611 778 223 254 350 635 591 950 398 192 231 113 153 97 968 946 38 738 13 859 360 735 434 111 170 530 986 914 93 622 174 728 611 878 653 545 681 114 388 485 981 929 822 170 269 54 998 106 481 511 315 520 761 727 937 312 605 986 612 144 281 379 518 774 334 665 293 2 958 113 114 576 891 385 959 52 109 260 513 246 671 219 342 685 446 878 900 802 791 820 496 619 387 523 215 959 509 570 621 685 939 950 387 431 861 746 668 944 235 184 954 370 679 415 319 708 514 877 353 848 946 335 399 679 935 453 831 519 814 567 453 424 856 181 63 293 582 791 462 298 906 839 753 674 409 361 996 143 277 971 840 495 374 963 15 255 842 503 617 320 462 921 467 146 251 767 28 71 461 821 615 708 458 763 317 908 709 389 495 364 917 566 367 456 675 342 685 453 188 333 128 157 811 210 570 182 79 823 477 237 932 906 400 701 493 648 43 310 558 365 124 889 382 118 270 767 739 816 232 157 507 449 51 927 4 90 957 454 945 606 57 820 952 526 460 955 527 975 866 203 251 565 898 552 338 484 366 867 862 16 842 402 225 79 25 633 490 113 295 265 828 221 632 932 955 855 295 590 932 719 630 77 82 897 493 872 131 611 234 991 53 32 50 151 763 789 55 910 944 720 846 929 836 775 799 699 903 67 490 106 392 904 420 245 357 927 551 142 645 968 936 779 1000 822 973 491 146 673 994 899 550 399 842 294 89 791 277 490 759 632 381 809 494 19 960 580 725 984 400 562 49 342 549 8 602 232 414 57 674 733 666 571 646 496 278 313 674 137 257 86 194 165 277 279 809 451 591 462 259 644 980 445 858 819 231 353 964 101 239 672 302 169 328 881 367 946 793 358 611 555 266 849 875 419 994 862 433 273 116 657 323 494 637 420 881 323 572 285 875 811 324 527 270 623 318 526 485 701 132 890 841 795 726 215 851 741 323 589 543 649 782 471 420 946 162 557 863 707 20 790 367 136 592 50 444 588 385 415 471 845 599 476 69 1000 538 19 400 78 467 724 577 279 856 569 111 390 164 636 475 319 685 567 171 607 783 752 700 366 460 264 215 402 134 241 386 190 840 637 158 197 346 861 207 510 155 59 76 678 743 474 158 923 550 799 781 195 311 72 758 353 594 597 132 445 943 735 90 914 668 450 386 13 716 81 147 182 887 114 975 160 597 659 70 266 586 662 754 726 264 178 529 46 541 598 538 10 494 901 295 488 798 576 638 684 73 191 0 567 215 654 770 804 794 266 320 366 403 130 926 685 970 489 957 450 428 802 251 608 788 145 316 658 394 797 625 427 703 768 902 926 131 157 24 156 998 225 701 301 703 349 649 140 705 608 395 96 543 984 37 241 245 52 764 717 493 398 469 893 573 618 326 510 827 698 630 914 463 577 191 124 318 138 910 102 623 928 999 823 70 799 152 817 931 117 120 925 295 12 301 88 412 517 484 666 593 361 486 37 943 925 193 490 512 813 609 504 650 164 284 708 432 561 864 35 680 658 181 790 987 108 346 301 894 624 881 815 701 505 972 760 894 997 917 405 561 316 521 274 967 688 496 299 498 393 709 417 275 99 606 363 360 690 419 316 482 954 55 563 562 812 237 889 3 589 224 239 258 224 521 87 634 609 167 62 234 80 338 307 812 853 212 252 677 245 236 946 310 272 901 88 599 773 565 613 618 429 544 292 371 731 258 162 792 413 54 406 648 729 950 670 637 390 960 789 807 710 821 800 773 965 117 208 51 158 184 883 355 43 421 232 559 259 748 396 983 796 622 242 533 739 314 529 913 642 987 660 240 69 443 132 431 957 730 251 902 990 857 584 407 874 413 620 314 914 15 892 785 419 145 379 825 839 488 923 904 921 174 883 761 830 322 576 996 777 912 611 845 841 529 224 489 271 127 868 591 273 755 940 804 356 63 319 474 636 654 539 365 412 787 592 368 605 119 817 943 427 985 26 521 269 18 777 818 332 650 809 479 383 797 282 943 996 301 949 129 304 901 709 45 148 907 93 776 384 375 695 208 43 293 748 748 78 340 598 522 803 389 64 452 409 525 23 969 345 263 772 952 341 207 817 729 583 562 175 562 207 877 916 26 940 207 408 541 997 391 614 193 124 893 501 343 124 259 816 510 99 302 358 146 725 879 718 520 670 376 990 131 96 215 524 99 368 793 52 826 224 445 995 428 256 641 852 21 820 191 702 985 497 156 950 56 362 448 211 547 551 635 629 368 978 708 981 362 637 975",
        expected: "258786",
      },
    ],
    hints: [
      "At the end of any day, the trader is in one of three situations. Name them.",
      "Holding a unit; just sold today (so tomorrow is a rest day); or not holding and free to buy.",
      "Write how each situation can be reached from yesterday's situations. Buying is only allowed from 'free'.",
      "Keep the best profit for each of the three states and update all three at once each day.",
    ],
    solutions: [
      {
        title: "Brute force: decide each day",
        order: 1,
        intuition:
          "Each day, either do nothing or act: buy if not holding, sell if holding. Selling jumps two days ahead, which enforces the rest day. Exploring both choices every day is exponential.",
        approach: [
          "Recurse on (day, holding).",
          "Past the last day, the profit is 0.",
          "Waiting is always allowed.",
          "If holding, selling earns the price and continues from day + 2 (not holding); otherwise buying costs the price and continues from day + 1 (holding).",
        ],
        code: {
          PYTHON: `def maxRestProfit(prices: List[int]) -> int:
    def best(day: int, holding: bool) -> int:
        if day >= len(prices):
            return 0
        wait = best(day + 1, holding)
        if holding:
            return max(wait, prices[day] + best(day + 2, False))  # sell, then rest
        return max(wait, -prices[day] + best(day + 1, True))  # buy

    return best(0, False)`,
          JAVA: `class Solution {
    private int[] prices;

    public int maxRestProfit(int[] prices) {
        this.prices = prices;
        return best(0, false);
    }

    private int best(int day, boolean holding) {
        if (day >= prices.length) return 0;
        int wait = best(day + 1, holding);
        if (holding) return Math.max(wait, prices[day] + best(day + 2, false));
        return Math.max(wait, -prices[day] + best(day + 1, true));
    }
}`,
        },
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["No prices, or a single price: 0."],
        commonMistakes: [
          "Continuing from day + 1 after a sale, which ignores the rest day.",
        ],
      },
      {
        title: "Optimal: three-state machine",
        order: 2,
        intuition:
          "At the end of each day the trader is holding, has just sold (cooling), or is free to buy. Today's best holding value is either yesterday's holding or yesterday's free value minus today's price. Today's free value is the better of yesterday's free and yesterday's cooling. Today's cooling value is yesterday's holding plus today's price. Using only yesterday's values on the right-hand side is what stops a sale and a purchase from touching.",
        approach: [
          "If there are no prices, return 0.",
          "Day 0: holding = −prices[0]; free = 0; cooling = 0 (no sale yet, harmless).",
          "For each later price, compute all three new values from the old ones simultaneously.",
          "Return max(free, cooling): ending while holding is never best.",
        ],
        code: {
          PYTHON: `def maxRestProfit(prices: List[int]) -> int:
    if not prices:
        return 0

    holding = -prices[0]  # best profit while owning a unit
    free = 0              # best profit, no unit, allowed to buy
    cooling = 0           # best profit having sold today

    for price in prices[1:]:
        holding, free, cooling = (
            max(holding, free - price),  # keep holding, or buy from free
            max(free, cooling),          # stay free, or finish resting
            holding + price,             # sell what we held
        )

    return max(free, cooling)`,
          JAVA: `class Solution {
    public int maxRestProfit(int[] prices) {
        if (prices.length == 0) return 0;

        int holding = -prices[0], free = 0, cooling = 0;

        for (int i = 1; i < prices.length; i++) {
            int price = prices[i];
            int nextHolding = Math.max(holding, free - price);
            int nextFree = Math.max(free, cooling);
            int nextCooling = holding + price;
            holding = nextHolding;
            free = nextFree;
            cooling = nextCooling;
        }

        return Math.max(free, cooling);
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Falling prices: never trade, 0.",
          "Flat prices: 0.",
          "Two rises separated by a single dip day: the rest day may cost a round.",
        ],
        commonMistakes: [
          "Updating the states one by one, so 'free' already includes today's sale when 'holding' is computed.",
          "Buying from the cooling state, which breaks the rest-day rule.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },
];
