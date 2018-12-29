'use strict'

module.exports = function AutoPetFeeder(mod) {
	const command = mod.command || mod.require.command;
    const SendNotifications = true; // Send notifications when items are consumed
    const MinimumEnergy = 5; // How much remaining energy the pet needs to trigger feed
    
    let enabled = true,
    gameId,
    playerLocation, 
    onCd = false;
    
    let feedList = [
    {
        name: 'Pet Treat', // Common item. Restores 30 energy
        id: 177131,
        invQtd: 0,
        dbid: 0,
    }
    ];
        
    mod.hook('S_LOGIN', 12, (event) => { gameId = event.gameId; });
    
    mod.hook('C_PLAYER_LOCATION', 5, (event) => { playerLocation = event; });
    
    mod.hook('S_INVEN', 16, (event) => {
        if (!enabled) return;

        let tempInv = event.items;
        for (let i = 0; i < tempInv.length; i++) {
            for (let o = 0; o < feedList.length; o++) {
                if (feedList[o].id == tempInv[i].id) {
                    feedList[o].invQtd = tempInv[i].amount;
                    feedList[o].dbid = tempInv[i].dbid;
                }
            }
        }
    });
        
    mod.hook('S_SPAWN_SERVANT', 2, (event) => {
			gameId = event.owner;
            if (enabled && event.energy < MinimumEnergy) {
                feedPet();
            }
    });
    
    mod.hook('S_CHANGE_SERVANT_ENERGY', 1, (event) => {
        if (enabled && event.energy < MinimumEnergy) {
            feedPet();
        }
    });


    
    function feedPet() {
        for (let i = 0; i < feedList.length; i++) {
            if (feedList[i].invQtd > 0) {
                useItem(feedList[i]);
                feedList[i].invQtd--;
                onCd = true;
                setTimeout(()=>{ onCd = false; }, 3000);
                if (SendNotifications) command.message('(auto-pet-feeder) Used ' + feedList[i].name + ', ' + feedList[i].invQtd + ' remaining.');
                return;
            }
        }
        
        // warning. no food in inventory
        command.message('(auto-pet-feeder) No pet food in inventory to feed pet');
    }
    
    function useItem(foodInfo) {
        mod.toServer('C_USE_ITEM', 3, {
            gameId: gameId,
            id: foodInfo.id,
            dbid: foodInfo.dbid,
            target: 0,
            amount: 1,
            dest: {x: 0, y: 0, z: 0},
            loc: playerLocation.loc,
            w: playerLocation.w,
            unk1: 0,
            unk2: 0,
            unk3: 0,
            unk4: true
        });
    }
    
    mod.command.add('autopetfeeder', () => {
        enabled = !enabled;
        command.message('(auto-pet-feeder) ' + (enabled) ? 'enabled' : 'disabled');
    });
    
    mod.command.add('feedpet', () => {
        feedPet();
    });

}
