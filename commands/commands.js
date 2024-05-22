
const TEST_COMMAND = {
    name: 'test',
    description: 'Basic guild commands',
    type: 1,
};

const CALCULATE = {
    name: 'calculate',
    description: 'Command to calculate how much we need of ingredients',
    type: 1,
    options: [
        {
            name: 'flvr',
            description: 'Represents the cheesecake flavour',
            type: 3,
            required: true,
            choices: [
                { name: 'O', value: 'original' },
                { name: 'C', value: 'choco' },
                { name: 'M', value: 'matcha' },
                { name: 'B', value: 'berry' },
            ],
        },
        {
            name: 'batches',
            description: 'Represents the number of batches',
            type: 3,
            required: true
        }
    ],
};

const ADD_TODO = {
    name: 'add',
    description: 'Command to add to a todo list',
    type: 1,
    options: [
        {
            name: 'todo',
            description: 'Represents the todo action',
            type: 3,
            required: true
        }
    ]
};

const REM_TODO = {
    name: 'remove',
    description: 'Command to add to a todo list',
    type: 1,
    options: [
        {
            name: 'id',
            description: 'Represents the todo id to delete - Copy the id below the todo that you want to delete',
            type: 3,
            required: true
        }
    ]
};

const PREP_PLAN = {
    name: 'prep',
    description: 'Command to display prep plan for the week',
    type: 1,
    options: [

        //Cheesecake cheese
        {
            name: 'notes',
            description: 'Represents a special note for this prep plan',
            type: 3,
            required: true
        },
        {
            name: 'oc-cheese',
            description: 'Represents Original Cheesecake cheese',
            type: 3,
            required: true
        },
        {
            name: 'mc-cheese',
            description: 'Represents Matcha Cheesecake cheese',
            type: 3,
            required: true
        },
        {
            name: 'cc-cheese',
            description: 'Represents Choco Cheesecake cheese',
            type: 3,
            required: true
        },

        //Tart Cheese
        {
            name: 'ot-cheese',
            description: 'Represents Original Tart Cheesecake cheese',
            type: 3,
            required: true
        },
        {
            name: 'mt-cheese',
            description: 'Represents Matcha Tart Cheesecake cheese',
            type: 3,
            required: true
        },
        {
            name: 'ct-cheese',
            description: 'Represents Choco Tart Cheesecake cheese',
            type: 3,
            required: true
        },


        //Butter cheesecake
        {
            name: 'oc-butter',
            description: 'Represents Original Cheesecake butter',
            type: 3,
            required: true
        },
        {
            name: 'mc-butter',
            description: 'Represents Matcha Cheesecake butter',
            type: 3,
            required: true
        },
        {
            name: 'cc-butter',
            description: 'Represents Choco Cheesecake butter',
            type: 3,
            required: true
        },

        //Mads butter
        {
            name: 'm-butter',
            description: 'Represents Madeleine butter',
            type: 3,
            required: true
        },
    ]

};

const PREP_UPDATE = {
    name: 'updateprep',
    description: 'Command to update the current prep plan',
    type: 1,
    options: [
        {
            name: 'update',
            description: 'Represents a thing to update',
            type: 3,
            required: true,
            choices: [
                { name: 'Update Special Notes', value: 'nt' },
                { name: 'Original Cheesecake Cheese', value: 'occ' },
                { name: 'Matcha Cheesecake Cheese', value: 'mcc' },
                { name: 'Choco Cheesecake Cheese', value: 'ccc' },
                { name: 'Original Tart Cheese', value: 'otc' },
                { name: 'Matcha Tart Cheese', value: 'mtc' },
                { name: 'Choco Tart Cheese', value: 'ctc' },
                { name: 'Original Cheesecake butter', value: 'ocb' },
                { name: 'Matcha Cheesecake Butter', value: 'mcb' },
                { name: 'Choco Cheesecake Butter', value: 'ccb' },
                { name: 'Madeleine Butter', value: 'mb' },
            ],
        },
        {
            name: 'value',
            description: 'Represents the new value',
            type: 3,
            required: true
        }
    ],
};


module.exports = { TEST_COMMAND, CALCULATE, ADD_TODO, REM_TODO, PREP_PLAN, PREP_UPDATE }

