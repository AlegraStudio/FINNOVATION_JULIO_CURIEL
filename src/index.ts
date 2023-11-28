import {
  Canister,
  Principal,
  update,
  query,
  ic,
  StableBTreeMap,
  Variant,
  Result,
  Err,
  Ok,
  blob,
  text,
  Nat
} from 'azle';

// Definimos errores personalizados para la manipulación de transacciones
const TransactionError = Variant({
  TransactionDoesNotExist: null,
  Unauthorized: null,
  InvalidOperation: null
});

// Estructura de datos para una transacción
const Transaction = Record({
  creator: Principal,
  amount: Nat,
  currency: text,
  timestamp: Nat,
  description: text
});

// Un mapa estable para almacenar transacciones con su ID único como clave
let transactions = StableBTreeMap(Principal, Transaction, 0);

// Canister principal de FInnovation
export default Canister({
  // Crear una nueva transacción
  createTransaction: update([Nat, text, text], Result(Transaction, TransactionError), (amount, currency, description) => {
    const id = generateUniqueId();
    const timestamp = ic.time();

    const transaction: typeof Transaction = {
      creator: ic.caller(),
      amount,
      currency,
      timestamp,
      description
    };

    transactions.insert(id, transaction);

    console.log(`New transaction created! ID:`, id.toText());
    return Ok(transaction);
  }),

  // Consultar todas las transacciones
  getAllTransactions: query([], Vec(Transaction), () => {
    return transactions.values();
  }),

  // Consultar una transacción específica por su ID
  getTransactionById: query([Principal], Result(Transaction, TransactionError), (id) => {
    const transactionOpt = transactions.get(id);

    if ('None' in transactionOpt) {
      return Err(TransactionError.TransactionDoesNotExist);
    }

    return Ok(transactionOpt.Some);
  }),

  // Actualizar una transacción existente (solo por el creador de la transacción)
  updateTransaction: update([Principal, Nat, text], Result(Transaction, TransactionError), (id, newAmount, newDescription) => {
    const transactionOpt = transactions.get(id);

    if ('None' in transactionOpt) {
      return Err(TransactionError.TransactionDoesNotExist);
    }

    const transaction = transactionOpt.Some;

    if (transaction.creator !== ic.caller()) {
      return Err(TransactionError.Unauthorized);
    }

    const updatedTransaction: typeof Transaction = {
      ...transaction,
      amount: newAmount,
      description: newDescription
    };

    transactions.insert(id, updatedTransaction);
    return Ok(updatedTransaction);
  }),

  // Eliminar una transacción (solo por el creador de la transacción)
  deleteTransaction: update([Principal], Result(Transaction, TransactionError), (id) => {
    const transactionOpt = transactions.get(id);

    if ('None' in transactionOpt) {
      return Err(TransactionError.TransactionDoesNotExist);
    }

    const transaction = transactionOpt.Some;

    if (transaction.creator !== ic.caller()) {
      return Err(TransactionError.Unauthorized);
    }

    transactions.remove(id);
    return Ok(transaction);
  }),
});

// Función para generar un ID único para las transacciones
function generateUniqueId(): Principal {
  // Esta función debería generar un ID único adecuado para su uso como clave en 'transactions'
  // El siguiente código es solo un marcador de posición y debe reemplazarse por un mecanismo de generación de ID adecuado
  const randomBytes = new Array(29).fill(0).map(() => Math.floor(Math.random() * 256));
  return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}
