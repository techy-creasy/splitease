/**
 * Balance Calculation Service
 * Calculates who owes what to whom based on expenses.
 */

/**
 * Calculate raw balances for each member in a group
 * @param {Array} expenses - List of expense documents (populated)
 * @param {Array} members - List of member user objects
 * @returns {Object} - Map of userId -> net balance (positive = owed money, negative = owes money)
 */
const calculateBalances = (expenses, members) => {
  const balanceMap = {};

 
  members.forEach(member => {
    balanceMap[member._id.toString()] = {
      userId: member._id.toString(),
      name: member.name,
      email: member.email,
      balance: 0
    };
  });

  
  expenses.forEach(expense => {
    const totalAmount = expense.amount;
    const splitCount = expense.splitAmong.length;
    const sharePerPerson = totalAmount / splitCount;
    const payerId = expense.paidBy._id.toString();

    if (balanceMap[payerId]) {
      balanceMap[payerId].balance += totalAmount;
    }

    expense.splitAmong.forEach(person => {
      const personId = person._id.toString();
      if (balanceMap[personId]) {
        balanceMap[personId].balance -= sharePerPerson;
      }
    });
  });

  return balanceMap;
};

/**
 * Generate minimal settlement transactions using a greedy algorithm
 * @param {Object} balanceMap - Map from calculateBalances()
 * @returns {Array} - List of { from, to, amount } settlement transactions
 */
const generateSettlements = (balanceMap) => {
  const settlements = [];

  
  let creditors = [];
  let debtors = [];

  Object.values(balanceMap).forEach(person => {
    const rounded = Math.round(person.balance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ ...person, balance: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ ...person, balance: Math.abs(rounded) });
    }
  });

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const settleAmount = Math.min(creditor.balance, debtor.balance);

    if (settleAmount > 0.01) {
      settlements.push({
        from: { userId: debtor.userId, name: debtor.name, email: debtor.email },
        to: { userId: creditor.userId, name: creditor.name, email: creditor.email },
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    creditor.balance -= settleAmount;
    debtor.balance -= settleAmount;

    if (creditor.balance < 0.01) i++;
    if (debtor.balance < 0.01) j++;
  }

  return settlements;
};

/**
 * Full balance summary for a group
 * @param {Array} expenses - Populated expenses
 * @param {Array} members - Group members
 * @returns {Object} - { balances, settlements, totalExpenses }
 */
const getGroupBalanceSummary = (expenses, members) => {
  const balanceMap = calculateBalances(expenses, members);
  const settlements = generateSettlements(balanceMap);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const balances = Object.values(balanceMap).map(b => ({
    ...b,
    balance: Math.round(b.balance * 100) / 100
  }));

  return {
    balances,
    settlements,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    expenseCount: expenses.length
  };
};

module.exports = { calculateBalances, generateSettlements, getGroupBalanceSummary };
