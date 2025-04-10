SRC = ./src
BIN = ${SRC}/bin
LIB = ${SRC}/lib
DATA = ${LIB}/storage/scripts

CMD = cd ${SRC} && cdk

run_all:
	${CMD} deploy --all

run:
	${CMD} deploy $(filter-out $@,$(MAKECMDGOALS))

destroy_all:
	${CMD} destroy --all

destroy:
	${CMD} destroy $(filter-out $@,$(MAKECMDGOALS))

seed:
	cd ${DATA} && npx ts-node seed-users-dynamo.ts $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

