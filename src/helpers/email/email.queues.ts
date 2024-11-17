export const EMAIL_QUEUES = [
  {
    id: 1,
    name: "user-registration",
    description:
      "This queue handles all emails sent when a user creates an account",
  },
  {
    id: 2,
    name: "password-reset",
    description:
      "This queue handles all emails sent when a user requests a password reset",
  },
] as const;

// Create a type from the queue names
// In TypeScript, indexing an array with number gives you the type of the elements inside it.
export type EmailQueueName = (typeof EMAIL_QUEUES)[number]["name"];


// Explanation:
// The as const in TypeScript is used to make an object completely immutable.

// Without "as const", TypeScript infers:
// EMAIL_QUEUES: {
//   id: number;
//   name: string;
//   description: string;
// }[]
// Which means that the type of EMAIL_QUEUES is an array of objects with id, name and description properties.

// With "as const" TypeScript infers:
// EMAIL_QUEUES: readonly [
//   {
//     readonly id: 1;
//     readonly name: "user-registration";
//     readonly description: "This queue handles all emails sent when a user creates an account";
//   },
//   {
//     readonly id: 2;
//     readonly name: "password-reset";
//     readonly description: "This queue handles all emails sent when a user requests a password reset";
//   }
// ]
// Which means that the type of EMAIL_QUEUES is a readonly array of objects with id, name and description properties.