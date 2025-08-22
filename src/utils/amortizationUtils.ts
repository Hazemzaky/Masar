import mongoose from 'mongoose';

// Interface for amortized cost items
interface AmortizedCostItem {
  _id: mongoose.Types.ObjectId;
  description: string;
  totalCost: number;
  amortizationPeriod: number; // in months
  startDate: Date;
  endDate?: Date;
  category: 'direct' | 'operating' | 'intangible';
  monthlyAmount: number;
}

// Interface for amortized costs result
export interface AmortizedCostsResult {
  directCosts: number;
  operatingCosts: number;
  intangibleCosts: number;
  breakdown: Array<{
    period: string;
    directCosts: number;
    operatingCosts: number;
    intangibleCosts: number;
    total: number;
  }>;
}

/**
 * Calculate amortized costs for a given period
 * This function handles the allocation of costs that need to be amortized over time
 * according to IFRS requirements (IAS 38 for intangible assets, etc.)
 */
export async function getAmortizedCosts(
  startDate: Date, 
  endDate: Date, 
  period: string
): Promise<AmortizedCostsResult> {
  try {
    // In a real implementation, this would query the database for amortized items
    // For now, we'll use placeholder data to demonstrate the logic
    
    // Mock amortized cost items - replace with actual database queries
    const amortizedItems: AmortizedCostItem[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        description: 'Software License',
        totalCost: 12000,
        amortizationPeriod: 24, // 2 years
        startDate: new Date('2024-01-01'),
        category: 'intangible',
        monthlyAmount: 500
      },
      {
        _id: new mongoose.Types.ObjectId(),
        description: 'Equipment Purchase',
        totalCost: 60000,
        amortizationPeriod: 60, // 5 years
        startDate: new Date('2024-01-01'),
        category: 'direct',
        monthlyAmount: 1000
      },
      {
        _id: new mongoose.Types.ObjectId(),
        description: 'Training Program',
        totalCost: 8000,
        amortizationPeriod: 12, // 1 year
        startDate: new Date('2024-03-01'),
        category: 'operating',
        monthlyAmount: 666.67
      }
    ];

    // Calculate period breakdown
    const periods = calculatePeriodBreakdown(startDate, endDate, period);
    
    let totalDirectCosts = 0;
    let totalOperatingCosts = 0;
    let totalIntangibleCosts = 0;
    
    const breakdown = periods.map(periodInfo => {
      let periodDirectCosts = 0;
      let periodOperatingCosts = 0;
      let periodIntangibleCosts = 0;
      
      // Calculate amortized costs for this period
      amortizedItems.forEach(item => {
        const itemStartDate = new Date(item.startDate);
        const itemEndDate = item.endDate || new Date(itemStartDate.getTime() + (item.amortizationPeriod * 30 * 24 * 60 * 60 * 1000));
        
        // Check if this item is active during this period
        if (itemStartDate <= periodInfo.end && (!itemEndDate || itemEndDate >= periodInfo.start)) {
          // Calculate how many months of this item fall within this period
          const periodStart = new Date(Math.max(periodInfo.start.getTime(), itemStartDate.getTime()));
          const periodEnd = new Date(Math.min(periodInfo.end.getTime(), itemEndDate ? itemEndDate.getTime() : Infinity));
          
          const monthsInPeriod = calculateMonthsBetween(periodStart, periodEnd);
          const costForPeriod = item.monthlyAmount * monthsInPeriod;
          
          // Allocate to appropriate category
          switch (item.category) {
            case 'direct':
              periodDirectCosts += costForPeriod;
              totalDirectCosts += costForPeriod;
              break;
            case 'operating':
              periodOperatingCosts += costForPeriod;
              totalOperatingCosts += costForPeriod;
              break;
            case 'intangible':
              periodIntangibleCosts += costForPeriod;
              totalIntangibleCosts += costForPeriod;
              break;
          }
        }
      });
      
      return {
        period: periodInfo.label,
        directCosts: periodDirectCosts,
        operatingCosts: periodOperatingCosts,
        intangibleCosts: periodIntangibleCosts,
        total: periodDirectCosts + periodOperatingCosts + periodIntangibleCosts
      };
    });

    return {
      directCosts: totalDirectCosts,
      operatingCosts: totalOperatingCosts,
      intangibleCosts: totalIntangibleCosts,
      breakdown
    };
  } catch (error) {
    console.error('Error calculating amortized costs:', error);
    return {
      directCosts: 0,
      operatingCosts: 0,
      intangibleCosts: 0,
      breakdown: []
    };
  }
}

/**
 * Calculate period breakdown for different reporting periods
 */
function calculatePeriodBreakdown(startDate: Date, endDate: Date, period: string) {
  const periods: Array<{ start: Date; end: Date; label: string }> = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    let periodEnd: Date;
    let label: string;
    
    switch (period) {
      case 'monthly':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarterly':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 3, 0);
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        label = `Q${quarter} ${current.getFullYear()}`;
        current.setMonth(current.getMonth() + 3);
        break;
      case 'half_yearly':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 6, 0);
        const half = Math.floor(current.getMonth() / 6) + 1;
        label = `H${half} ${current.getFullYear()}`;
        current.setMonth(current.getMonth() + 6);
        break;
      case 'yearly':
        periodEnd = new Date(current.getFullYear(), 11, 31);
        label = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        periodEnd = new Date(current.getFullYear(), 11, 31);
        label = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
    }
    
    periods.push({ start: new Date(current), end: periodEnd, label });
  }
  
  return periods;
}

/**
 * Calculate the number of months between two dates
 */
function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const yearDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();
  const dayDiff = endDate.getDate() - startDate.getDate();
  
  let months = yearDiff * 12 + monthDiff;
  
  // Adjust for partial months
  if (dayDiff < 0) {
    months--;
  }
  
  return Math.max(0, months);
}

/**
 * Get amortization schedule for a specific item
 * This is useful for detailed reporting and audit trails
 */
export function getAmortizationSchedule(
  totalCost: number,
  amortizationPeriod: number,
  startDate: Date,
  endDate?: Date
): Array<{ month: string; amount: number; cumulativeAmount: number }> {
  const monthlyAmount = totalCost / amortizationPeriod;
  const schedule = [];
  const actualEndDate = endDate || new Date(startDate.getTime() + (amortizationPeriod * 30 * 24 * 60 * 60 * 1000));
  
  let currentDate = new Date(startDate);
  let cumulativeAmount = 0;
  
  while (currentDate < actualEndDate && schedule.length < amortizationPeriod) {
    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    cumulativeAmount += monthlyAmount;
    
    schedule.push({
      month: monthLabel,
      amount: monthlyAmount,
      cumulativeAmount
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return schedule;
}

/**
 * Calculate remaining book value of an amortized asset
 */
export function calculateRemainingBookValue(
  totalCost: number,
  amortizationPeriod: number,
  startDate: Date,
  asOfDate: Date = new Date()
): number {
  const monthlyAmount = totalCost / amortizationPeriod;
  const monthsElapsed = calculateMonthsBetween(startDate, asOfDate);
  const totalAmortized = Math.min(monthlyAmount * monthsElapsed, totalCost);
  
  return Math.max(0, totalCost - totalAmortized);
} 