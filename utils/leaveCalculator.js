const LeaveBalance = require('../models/LeaveBalance');
const LeaveApplication = require('../models/LeaveApplication');

class LeaveCalculator {
  static calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  static async getLeaveBalance(userId, leaveTypeId, year = new Date().getFullYear()) {
    let balance = await LeaveBalance.findOne({
      user: userId,
      leaveType: leaveTypeId,
      year: year
    }).populate('leaveType');

    if (!balance) {
      const LeaveType = require('../models/LeaveType');
      const leaveType = await LeaveType.findById(leaveTypeId);
      
      if (!leaveType) {
        throw new Error('Leave type not found');
      }

      balance = new LeaveBalance({
        user: userId,
        leaveType: leaveTypeId,
        totalDays: leaveType.maxDays,
        usedDays: 0,
        carryForwardDays: 0,
        year: year
      });

      await balance.save();
      await balance.populate('leaveType');
    }

    return balance;
  }

  static async updateLeaveBalance(userId, leaveTypeId, days, year = new Date().getFullYear()) {
    const balance = await LeaveBalance.findOne({
      user: userId,
      leaveType: leaveTypeId,
      year: year
    });

    if (balance) {
      balance.usedDays += days;
      await balance.save();
    }
  }

  static async canApplyForLeave(userId, leaveTypeId, days, year = new Date().getFullYear()) {
    const balance = await this.getLeaveBalance(userId, leaveTypeId, year);
    const availableDays = balance.totalDays + balance.carryForwardDays - balance.usedDays;
    
    return availableDays >= days;
  }

  static async processCarryForward(userId, year = new Date().getFullYear()) {
    const previousYear = year - 1;
    const currentBalances = await LeaveBalance.find({ user: userId, year: year });
    const previousBalances = await LeaveBalance.find({ user: userId, year: previousYear }).populate('leaveType');

    for (const prevBalance of previousBalances) {
      if (prevBalance.leaveType.carryForward) {
        const availableDays = prevBalance.totalDays + prevBalance.carryForwardDays - prevBalance.usedDays;
        const carryForwardDays = Math.min(availableDays, prevBalance.leaveType.maxCarryForwardDays);

        if (carryForwardDays > 0) {
          let currentBalance = currentBalances.find(b => 
            b.leaveType.toString() === prevBalance.leaveType._id.toString()
          );

          if (!currentBalance) {
            currentBalance = new LeaveBalance({
              user: userId,
              leaveType: prevBalance.leaveType._id,
              totalDays: prevBalance.leaveType.maxDays,
              usedDays: 0,
              carryForwardDays: carryForwardDays,
              year: year
            });
          } else {
            currentBalance.carryForwardDays = carryForwardDays;
          }

          await currentBalance.save();
        }
      }
    }
  }
}

module.exports = LeaveCalculator;